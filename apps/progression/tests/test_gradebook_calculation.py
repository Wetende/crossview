from apps.progression.views import _calculate_gradebook_totals


def test_weighted_gradebook_respects_component_title_matching():
    grading_config = {
        "type": "weighted",
        "components": [
            {"key": "cat", "label": "CAT", "weight": 0.30},
            {"key": "exam", "label": "Final Exam", "weight": 0.70},
        ],
        "pass_mark": 50,
    }

    quizzes = [
        {
            "id": 1,
            "title": "CAT 1",
            "passThreshold": 50,
            "maxAttempts": 3,
            "allowRetakeAfterPass": False,
        },
        {
            "id": 2,
            "title": "Final Exam",
            "passThreshold": 50,
            "maxAttempts": 1,
            "allowRetakeAfterPass": False,
        },
    ]

    result = _calculate_gradebook_totals(
        grading_config,
        quizzes,
        [],
        [
            {"quizId": 1, "score": 90.0, "passed": True, "attemptNumber": 1},
            {"quizId": 2, "score": 40.0, "passed": False, "attemptNumber": 1},
        ],
        [],
    )

    assert result["components"]["cat"] == 90.0
    assert result["components"]["exam"] == 40.0
    assert result["total"] == 55.0
    assert result["status"] == "Pass"


def test_weighted_gradebook_without_components_uses_assessment_weights():
    result = _calculate_gradebook_totals(
        {"type": "weighted", "components": [], "pass_mark": 50},
        [
            {
                "id": 1,
                "title": "Module quiz",
                "weight": 20,
                "passThreshold": 50,
                "maxAttempts": 1,
                "allowRetakeAfterPass": False,
            }
        ],
        [
            {
                "id": 2,
                "title": "Practical assignment",
                "weight": 80,
                "passThreshold": 50,
            }
        ],
        [{"quizId": 1, "score": 100.0, "passed": True, "attemptNumber": 1}],
        [
            {
                "assignmentId": 2,
                "weight": 80,
                "score": 50.0,
                "passed": True,
            }
        ],
    )

    assert result["total"] == 60.0
    assert result["calculation"]["method"] == "assessment_weights"
