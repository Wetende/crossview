/**
 * Convert between question bank entries and course-builder questions.
 *
 * Bank entries arrive as `entry.question_data` (the server's snapshot view);
 * the builder edits flat question objects. Both directions live here so they
 * stay in step.
 */

// The builder's True/False buttons use index 0 for True and 1 for False.
const TRUE_INDEX = 0;
const FALSE_INDEX = 1;

const isTrue = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === TRUE_INDEX;
    return ["true", "t", "yes", "0"].includes(
        String(value ?? "").trim().toLowerCase(),
    );
};

// Snapshot items carry server keys the builder does not edit.
const withoutKey = (item) => {
    const copy = { ...item };
    delete copy.key;
    delete copy.id;
    return copy;
};

const optionText = (option) =>
    typeof option === "string" ? option : option?.text;

export const libraryEntryToBuilderQuestion = (entry) => {
    const data = entry?.question_data || {};
    const answerData = data.answer_data || {};
    const type = data.question_type || entry?.question_type || "mcq";
    const rawOptions = data.options || [];
    const flaggedIndexes = rawOptions
        .map((option, index) => (option?.is_correct ? index : null))
        .filter((index) => index !== null);

    let correct = answerData.correct ?? 0;
    if (type === "true_false") {
        correct = isTrue(answerData.correct) ? TRUE_INDEX : FALSE_INDEX;
    } else if (type === "mcq" && flaggedIndexes.length > 0) {
        correct = flaggedIndexes[0];
    }

    return {
        type,
        text: data.text || "",
        points: data.points || 1,
        options: rawOptions
            .map(optionText)
            .filter((text) => typeof text === "string"),
        correct,
        correct_indices:
            answerData.correct_indices ||
            (type === "mcq_multi" ? flaggedIndexes : []),
        pairs: (data.matching_pairs || []).map(withoutKey),
        gaps: (data.gap_answers || []).map(withoutKey),
        image_pairs: (data.image_matching_pairs || []).map(withoutKey),
        items: (answerData.items || answerData.correct_order || []).filter(
            (item) => typeof item === "string",
        ),
        explanations: answerData.explanations || {},
        keywords: answerData.keywords || [],
        manual_grading: answerData.manual_grading ?? true,
        fromLibrary: true,
        libraryEntryId: entry?.id ?? null,
        libraryEntryVersion: entry?.snapshot_version ?? null,
    };
};

export const snapshotForQuestion = (question) => {
    const type = question?.type || "mcq";
    const options = (question?.options || []).map((text, position) => ({
        text,
        position,
        is_correct:
            type === "mcq"
                ? position === question.correct
                : type === "mcq_multi"
                  ? (question.correct_indices || []).includes(position)
                  : false,
    }));
    const answerData = {};
    if (type === "mcq") answerData.correct = question.correct ?? 0;
    if (type === "mcq_multi") {
        answerData.correct_indices = question.correct_indices || [];
    }
    if (type === "true_false") {
        answerData.correct = (question.correct ?? TRUE_INDEX) === TRUE_INDEX;
    }
    if (type === "short_answer") {
        answerData.keywords = question.keywords || [];
        answerData.manual_grading = question.manual_grading ?? true;
    }
    if (type === "ordering") {
        answerData.items = question.items || [];
        answerData.explanations = question.explanations || {};
    }
    return {
        question_type: type,
        text: question?.text || "",
        points: question?.points || 1,
        answer_data: answerData,
        options,
        matching_pairs: question?.pairs || [],
        gap_answers: question?.gaps || [],
        image_matching_pairs: question?.image_pairs || [],
    };
};
