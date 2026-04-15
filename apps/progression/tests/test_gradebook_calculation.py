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

