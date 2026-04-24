const decodeHtmlEntities = (value) => {
    const raw = String(value ?? '');

    if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = raw;
        return textarea.value.replace(/\u00a0/g, ' ');
    }

    return raw
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#160;/gi, ' ')
        .replace(/&#xa0;/gi, ' ')
        .replace(/&#39;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>');
};

export const normalizeText = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    const decoded = decodeHtmlEntities(value).replace(/\u00a0/g, ' ');
    // Strip any HTML tags (e.g. <p>, <br>) that may leak from rich-text editors
    const text = decoded.replace(/<[^>]*>/g, '').trim();
    return text || fallback;
};

const toNumberOrNull = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const optionLabelToBoolean = (label) => {
    const normalized = normalizeText(label).toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return null;
};

const normalizeOption = (option, index) => {
    if (option && typeof option === 'object' && !Array.isArray(option)) {
        const textCandidate =
            option.text ?? option.label ?? (typeof option.value === 'string' ? option.value : null);
        const text = normalizeText(textCandidate, `Option ${index + 1}`);
        const position = toNumberOrNull(option.position);
        const idValue =
            option.id ?? option.value ?? position ?? option.index ?? index;

        return {
            id: String(idValue),
            text,
            isCorrect: Boolean(option.isCorrect ?? option.is_correct),
            position: position ?? index,
        };
    }

    return {
        id: String(index),
        text: normalizeText(option, `Option ${index + 1}`),
        isCorrect: false,
        position: index,
    };
};

const dedupeStrings = (values) => {
    const seen = new Set();
    const result = [];
    values.forEach((value) => {
        const normalized = String(value);
        if (!seen.has(normalized)) {
            seen.add(normalized);
            result.push(normalized);
        }
    });
    return result;
};

const normalizePairs = (rawPairs) => {
    if (!Array.isArray(rawPairs)) return [];

    return rawPairs
        .map((pair, index) => {
            if (!pair || typeof pair !== 'object') return null;
            const left = normalizeText(
                pair.left_text ?? pair.leftText ?? pair.left,
                `Item ${index + 1}`,
            );
            const right = normalizeText(
                pair.right_text ?? pair.rightText ?? pair.right,
                '',
            );
            if (!right) return null;
            return {
                left_text: left,
                right_text: right,
                explanation: normalizeText(
                    pair.explanation ?? pair.note,
                    '',
                ),
            };
        })
        .filter(Boolean);
};

const normalizeGaps = (rawGaps) => {
    if (!Array.isArray(rawGaps)) return [];

    return rawGaps
        .map((gap, index) => {
            if (!gap || typeof gap !== 'object') {
                return {
                    gap_index: index,
                    accepted_answers: [],
                };
            }

            const gapIndex = toNumberOrNull(gap.gap_index);
            const acceptedRaw =
                gap.accepted_answers ?? gap.acceptedAnswers ?? gap.answers ?? [];
            const accepted = Array.isArray(acceptedRaw)
                ? acceptedRaw.map((item) => normalizeText(item)).filter(Boolean)
                : [];

            return {
                gap_index: gapIndex ?? index,
                accepted_answers: accepted,
                explanation: normalizeText(
                    gap.explanation ?? gap.note,
                    '',
                ),
            };
        })
        .sort((a, b) => a.gap_index - b.gap_index);
};

const normalizeImageItems = (items, side, indexPrefix = side) => {
    if (!Array.isArray(items)) return [];

    return items.map((item, index) => {
        const idValue = item?.id ?? item?.item_id ?? `${indexPrefix}_${index}`;
        return {
            id: String(idValue),
            text: normalizeText(item?.text ?? item?.label, ''),
            image: normalizeText(item?.image ?? item?.url, ''),
        };
    });
};

const normalizeImageMatching = (rawQuestion) => {
    const directLeft = normalizeImageItems(rawQuestion.left_items, 'left');
    const directRight = normalizeImageItems(rawQuestion.right_items, 'right');

    if (directLeft.length > 0 && directRight.length > 0) {
        const map = {};
        directLeft.forEach((leftItem, index) => {
            const rightItem = directRight[index];
            if (rightItem) {
                map[leftItem.id] = rightItem.id;
            }
        });

        return {
            left_items: directLeft,
            right_items: directRight,
            correctImageMatchingMap: map,
        };
    }

    const rawPairs = Array.isArray(rawQuestion.image_pairs) ? rawQuestion.image_pairs : [];
    const leftItems = [];
    const rightItems = [];
    const correctImageMatchingMap = {};

    rawPairs.forEach((pair, index) => {
        if (!pair || typeof pair !== 'object') return;

        const leftId = String(pair.left_id ?? `left_${index}`);
        const rightId = String(pair.right_id ?? `right_${index}`);

        leftItems.push({
            id: leftId,
            text: normalizeText(pair.question_text, `Item ${index + 1}`),
            image: normalizeText(pair.question_image, ''),
        });

        rightItems.push({
            id: rightId,
            text: normalizeText(pair.answer_text, ''),
            image: normalizeText(pair.answer_image, ''),
        });

        correctImageMatchingMap[leftId] = rightId;
    });

    return {
        left_items: leftItems,
        right_items: rightItems,
        correctImageMatchingMap,
    };
};

const getCorrectOptionId = (type, rawQuestion, options) => {
    const explicit =
        rawQuestion.correct ??
        rawQuestion.correctAnswer ??
        rawQuestion.answer_data?.correct;

    if (type === 'true_false' && typeof explicit === 'boolean') {
        const targetBool = explicit;
        const match = options.find((opt) => optionLabelToBoolean(opt.text) === targetBool);
        if (match) return match.id;
    }

    const explicitNumber = toNumberOrNull(explicit);
    if (explicitNumber !== null) {
        const matchByPosition = options.find((opt) => opt.position === explicitNumber);
        if (matchByPosition) return matchByPosition.id;

        const byIndex = options[explicitNumber];
        if (byIndex) return byIndex.id;
    }

    const flagged = options.find((opt) => opt.isCorrect);
    if (flagged) return flagged.id;

    return null;
};

const getCorrectOptionIds = (rawQuestion, options) => {
    const explicit =
        rawQuestion.correctAnswers ??
        rawQuestion.correct_indices ??
        rawQuestion.answer_data?.correct_indices ??
        [];

    const resolved = [];
    if (Array.isArray(explicit)) {
        explicit.forEach((value) => {
            const numeric = toNumberOrNull(value);
            if (numeric !== null) {
                const match = options.find((opt) => opt.position === numeric) ?? options[numeric];
                if (match) {
                    resolved.push(match.id);
                }
            } else if (value !== null && value !== undefined) {
                resolved.push(String(value));
            }
        });
    }

    if (resolved.length > 0) {
        return dedupeStrings(resolved);
    }

    const flagged = options.filter((opt) => opt.isCorrect).map((opt) => opt.id);
    return dedupeStrings(flagged);
};

export const normalizeQuestions = (rawQuestions = []) => {
    if (!Array.isArray(rawQuestions)) return [];

    return rawQuestions
        .map((rawQuestion, index) => {
            const type = normalizeText(
                rawQuestion?.type ?? rawQuestion?.question_type,
                'mcq',
            ).toLowerCase();

            const id = String(rawQuestion?.id ?? `question_${index}`);
            const pointsRaw = toNumberOrNull(rawQuestion?.points);
            const points = pointsRaw && pointsRaw > 0 ? pointsRaw : 1;

            let options = Array.isArray(rawQuestion?.options)
                ? rawQuestion.options.map((option, optionIndex) =>
                      normalizeOption(option, optionIndex),
                  )
                : [];

            if (type === 'true_false' && options.length === 0) {
                options = [
                    normalizeOption('True', 0),
                    normalizeOption('False', 1),
                ];
            }

            const pairs = normalizePairs(
                rawQuestion?.pairs ?? rawQuestion?.matching_pairs,
            );
            const matchingExplanations = Object.fromEntries(
                pairs
                    .filter((pair) => pair.explanation)
                    .map((pair) => [pair.left_text, pair.explanation]),
            );

            const orderingItemsRaw =
                rawQuestion?.items ??
                rawQuestion?.correct_order ??
                rawQuestion?.answer_data?.items ??
                rawQuestion?.answer_data?.correct_order ??
                [];
            const items = Array.isArray(orderingItemsRaw)
                ? orderingItemsRaw.map((item) => normalizeText(item)).filter(Boolean)
                : [];
            const orderingExplanationsRaw =
                rawQuestion?.orderingExplanations ??
                rawQuestion?.explanations ??
                rawQuestion?.answer_data?.explanations ??
                {};
            const orderingExplanations =
                orderingExplanationsRaw && typeof orderingExplanationsRaw === 'object'
                    ? orderingExplanationsRaw
                    : {};

            const gaps = normalizeGaps(
                rawQuestion?.gaps ?? rawQuestion?.gap_answers,
            );
            const fillBlankExplanations = Object.fromEntries(
                gaps
                    .filter((gap) => gap.explanation)
                    .map((gap) => [String(gap.gap_index), gap.explanation]),
            );

            const keywordsRaw =
                rawQuestion?.keywords ?? rawQuestion?.answer_data?.keywords ?? [];
            const keywords = Array.isArray(keywordsRaw)
                ? keywordsRaw.map((keyword) => normalizeText(keyword)).filter(Boolean)
                : [];

            const manualGradingRaw =
                rawQuestion?.manual_grading ?? rawQuestion?.answer_data?.manual_grading;
            const manualGrading =
                manualGradingRaw === undefined ? keywords.length === 0 : Boolean(manualGradingRaw);

            const {
                left_items,
                right_items,
                correctImageMatchingMap,
            } = normalizeImageMatching(rawQuestion || {});

            const correctOptionId = getCorrectOptionId(type, rawQuestion || {}, options);
            const correctOptionIds = getCorrectOptionIds(rawQuestion || {}, options);

            return {
                id,
                type,
                text: normalizeText(rawQuestion?.text ?? rawQuestion?.question, 'Untitled question'),
                points,
                explanation: normalizeText(
                    rawQuestion?.explanation ?? rawQuestion?.answer_data?.explanation,
                    '',
                ),
                options,
                pairs,
                items,
                gaps,
                keywords,
                manualGrading,
                left_items,
                right_items,
                correctOptionId,
                correctOptionIds,
                correctMatchingMap: Object.fromEntries(
                    pairs.map((pair) => [pair.left_text, pair.right_text]),
                ),
                matchingExplanations,
                correctOrdering: items,
                orderingExplanations,
                fillBlankExplanations,
                correctImageMatchingMap,
            };
        })
        .filter((question) => question.text || question.type);
};

const compareSets = (leftValues, rightValues) => {
    const leftSet = new Set((leftValues || []).map((value) => String(value)));
    const rightSet = new Set((rightValues || []).map((value) => String(value)));

    if (leftSet.size !== rightSet.size) return false;

    for (const value of leftSet) {
        if (!rightSet.has(value)) return false;
    }

    return true;
};

const roundTo2 = (value) => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
};

const scoreByRatio = (points, correctCount, totalCount) => {
    if (!totalCount || totalCount <= 0) return 0;
    if (correctCount === totalCount) return points;
    return roundTo2(points * (correctCount / totalCount));
};

const normalizeFillBlankAnswer = (value) =>
    normalizeText(value)
        .replace(/\s+/g, ' ')
        .toLowerCase();

export const isQuestionAnswered = (question, answer) => {
    if (answer === null || answer === undefined) return false;

    switch (question.type) {
        case 'mcq':
        case 'true_false':
            return String(answer).trim() !== '';
        case 'mcq_multi':
            return Array.isArray(answer) && answer.length > 0;
        case 'short_answer':
            return normalizeText(answer).length > 0;
        case 'matching':
            return typeof answer === 'object' && Object.keys(answer || {}).length > 0;
        case 'fill_blank':
            return (
                typeof answer === 'object' &&
                Object.values(answer || {}).some((value) => normalizeText(value).length > 0)
            );
        case 'ordering':
            return Array.isArray(answer) && answer.length > 0;
        case 'image_matching':
            return typeof answer === 'object' && Object.keys(answer || {}).length > 0;
        default:
            return false;
    }
};

const evaluateQuestion = (question, answer) => {
    const unanswered = !isQuestionAnswered(question, answer);

    if (question.type === 'short_answer' && question.manualGrading) {
        return {
            graded: false,
            isCorrect: null,
            pointsEarned: 0,
            pointsPossible: 0,
        };
    }

    if (unanswered) {
        return {
            graded: true,
            isCorrect: false,
            pointsEarned: 0,
            pointsPossible: question.points,
        };
    }

    if (question.type === 'mcq' || question.type === 'true_false') {
        const isCorrect =
            question.correctOptionId !== null &&
            question.correctOptionId !== undefined &&
            String(answer) === String(question.correctOptionId);
        return {
            graded: true,
            isCorrect,
            pointsEarned: isCorrect ? question.points : 0,
            pointsPossible: question.points,
        };
    }

    if (question.type === 'mcq_multi') {
        const submitted = Array.isArray(answer) ? answer.map((value) => String(value)) : [];
        const correctSet = new Set(question.correctOptionIds || []);
        const submittedSet = new Set(submitted);
        const isCorrect = compareSets(submitted, question.correctOptionIds || []);

        if (isCorrect) {
            return {
                graded: true,
                isCorrect: true,
                pointsEarned: question.points,
                pointsPossible: question.points,
            };
        }

        // Penalized partial credit:
        // ratio = clamp((correct_selected - incorrect_selected) / total_correct, 0, 1)
        const totalCorrect = correctSet.size;
        if (totalCorrect === 0) {
            return {
                graded: true,
                isCorrect: false,
                pointsEarned: 0,
                pointsPossible: question.points,
            };
        }
        let correctSelected = 0;
        let incorrectSelected = 0;
        submittedSet.forEach((value) => {
            if (correctSet.has(value)) {
                correctSelected += 1;
            } else {
                incorrectSelected += 1;
            }
        });
        const ratio = Math.min(1, Math.max(0, (correctSelected - incorrectSelected) / totalCorrect));
        const pointsEarned = roundTo2(question.points * ratio);
        return {
            graded: true,
            isCorrect: false,
            pointsEarned,
            pointsPossible: question.points,
        };
    }

    if (question.type === 'matching') {
        const entries = question.pairs || [];
        const selections = typeof answer === 'object' ? answer : {};
        if (entries.length === 0) {
            return {
                graded: false,
                isCorrect: null,
                pointsEarned: 0,
                pointsPossible: 0,
            };
        }

        let correctCount = 0;
        entries.forEach((pair) => {
            const submitted = selections[pair.left_text];
            if (normalizeText(submitted) === pair.right_text) {
                correctCount += 1;
            }
        });

        const pointsEarned = scoreByRatio(question.points, correctCount, entries.length);
        return {
            graded: true,
            isCorrect: correctCount === entries.length,
            pointsEarned,
            pointsPossible: question.points,
        };
    }

    if (question.type === 'fill_blank') {
        const entries = question.gaps || [];
        const selections = typeof answer === 'object' ? answer : {};
        if (entries.length === 0) {
            return {
                graded: false,
                isCorrect: null,
                pointsEarned: 0,
                pointsPossible: 0,
            };
        }

        let correctCount = 0;
        entries.forEach((gap) => {
            const submitted = normalizeFillBlankAnswer(
                selections[String(gap.gap_index)] ?? selections[gap.gap_index],
            );
            const accepted = (gap.accepted_answers || []).map((item) => normalizeFillBlankAnswer(item));
            if (submitted && accepted.includes(submitted)) {
                correctCount += 1;
            }
        });

        const pointsEarned = scoreByRatio(question.points, correctCount, entries.length);
        return {
            graded: true,
            isCorrect: correctCount === entries.length,
            pointsEarned,
            pointsPossible: question.points,
        };
    }

    if (question.type === 'ordering') {
        const expected = question.correctOrdering || [];
        const submitted = Array.isArray(answer) ? answer : [];
        if (expected.length === 0) {
            return {
                graded: false,
                isCorrect: null,
                pointsEarned: 0,
                pointsPossible: 0,
            };
        }
        const isCorrect =
            submitted.length === expected.length &&
            submitted.every((item, index) => normalizeText(item) === normalizeText(expected[index]));

        // Score by correct final position count
        let correctCount = 0;
        expected.forEach((expectedItem, index) => {
            if (index < submitted.length && normalizeText(submitted[index]) === normalizeText(expectedItem)) {
                correctCount += 1;
            }
        });

        const pointsEarned = isCorrect
            ? question.points
            : scoreByRatio(question.points, correctCount, expected.length);

        return {
            graded: true,
            isCorrect,
            pointsEarned,
            pointsPossible: question.points,
        };
    }

    if (question.type === 'image_matching') {
        const expected = question.correctImageMatchingMap || {};
        const submitted = typeof answer === 'object' ? answer : {};
        const leftIds = Object.keys(expected);
        if (leftIds.length === 0) {
            return {
                graded: false,
                isCorrect: null,
                pointsEarned: 0,
                pointsPossible: 0,
            };
        }

        let correctCount = 0;
        leftIds.forEach((leftId) => {
            if (String(submitted[leftId] ?? '') === String(expected[leftId])) {
                correctCount += 1;
            }
        });

        const pointsEarned = scoreByRatio(question.points, correctCount, leftIds.length);
        return {
            graded: true,
            isCorrect: correctCount === leftIds.length,
            pointsEarned,
            pointsPossible: question.points,
        };
    }

    if (question.type === 'short_answer') {
        const submission = normalizeText(answer).toLowerCase();
        const keywords = (question.keywords || []).map((keyword) => normalizeText(keyword).toLowerCase());
        const isCorrect = keywords.some((keyword) => submission.includes(keyword));
        return {
            graded: true,
            isCorrect,
            pointsEarned: isCorrect ? question.points : 0,
            pointsPossible: question.points,
        };
    }

    return {
        graded: false,
        isCorrect: null,
        pointsEarned: 0,
        pointsPossible: 0,
    };
};

const getOptionTextById = (question, id) => {
    const option = (question.options || []).find((item) => String(item.id) === String(id));
    return option ? option.text : '';
};

export const formatAnswer = (question, answer, isCorrectAnswer = false) => {
    if (answer === null || answer === undefined) return 'No answer';

    if (question.type === 'mcq' || question.type === 'true_false') {
        const optionText = getOptionTextById(question, answer);
        return optionText || 'No answer';
    }

    if (question.type === 'mcq_multi') {
        const values = Array.isArray(answer) ? answer : [];
        const labels = values
            .map((value) => getOptionTextById(question, value))
            .filter(Boolean);
        return labels.length > 0 ? labels.join(', ') : 'No answer';
    }

    if (question.type === 'short_answer') {
        if (isCorrectAnswer) {
            const keywords = question.keywords || [];
            return keywords.length > 0 ? keywords.join(', ') : 'Manual grading';
        }
        return normalizeText(answer, 'No answer');
    }

    if (question.type === 'matching') {
        const map = typeof answer === 'object' ? answer : {};
        const explanations = question.matchingExplanations || {};
        const lines = Object.entries(map)
            .map(([left, right]) => {
                const explanation = isCorrectAnswer
                    ? normalizeText(explanations[left], '')
                    : '';
                return explanation
                    ? `${left} -> ${right} (${explanation})`
                    : `${left} -> ${right}`;
            })
            .filter((line) => line.endsWith('-> ') === false);
        return lines.length > 0 ? lines.join(' | ') : 'No answer';
    }

    if (question.type === 'fill_blank') {
        const map = typeof answer === 'object' ? answer : {};
        const explanations = question.fillBlankExplanations || {};
        const lines = Object.entries(map)
            .map(([key, value]) => {
                const explanation = isCorrectAnswer
                    ? normalizeText(
                          explanations[String(key)] ?? explanations[key],
                          '',
                      )
                    : '';
                const base = `Blank ${Number(key) + 1}: ${normalizeText(value)}`;
                return explanation ? `${base} (${explanation})` : base;
            })
            .filter((line) => !line.endsWith(': '));
        return lines.length > 0 ? lines.join(' | ') : 'No answer';
    }

    if (question.type === 'ordering') {
        if (!Array.isArray(answer) || answer.length === 0) return 'No answer';
        if (!isCorrectAnswer) return answer.join(' > ');

        const explanations = question.orderingExplanations || {};
        return answer
            .map((item, idx) => {
                const explanation = normalizeText(
                    explanations[`item_${idx}`] ?? explanations[String(idx)],
                    '',
                );
                return explanation ? `${item} (${explanation})` : item;
            })
            .join(' > ');
    }

    if (question.type === 'image_matching') {
        const map = typeof answer === 'object' ? answer : {};
        const rightMap = new Map((question.right_items || []).map((item) => [String(item.id), item]));
        const leftMap = new Map((question.left_items || []).map((item) => [String(item.id), item]));

        const lines = Object.entries(map)
            .map(([leftId, rightId]) => {
                const leftItem = leftMap.get(String(leftId));
                const rightItem = rightMap.get(String(rightId));
                const leftLabel = leftItem?.text || leftId;
                const rightLabel = rightItem?.text || rightId;
                return `${leftLabel} -> ${rightLabel}`;
            })
            .filter(Boolean);

        return lines.length > 0 ? lines.join(' | ') : 'No answer';
    }

    return normalizeText(answer, 'No answer');
};

export const evaluateQuizAnswers = (questions, answers) => {
    const evaluations = questions.map((question) => {
        const answer = answers[String(question.id)] ?? answers[question.id];
        const evaluation = evaluateQuestion(question, answer);
        return {
            question,
            answer,
            ...evaluation,
        };
    });

    const gradedEvaluations = evaluations.filter((entry) => entry.graded);
    const pointsPossible = gradedEvaluations.reduce(
        (total, entry) => total + entry.pointsPossible,
        0,
    );
    const pointsEarned = roundTo2(
        gradedEvaluations.reduce(
            (total, entry) => total + entry.pointsEarned,
            0,
        ),
    );
    const score = pointsPossible > 0 ? roundTo2((pointsEarned / pointsPossible) * 100) : 0;

    return {
        evaluations,
        pointsPossible,
        pointsEarned,
        score,
        ungradedCount: evaluations.filter((entry) => !entry.graded).length,
    };
};
