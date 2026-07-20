"""
Curriculum services - Node properties handling and validation.
"""
import os
from typing import Dict, Any
from django.conf import settings

from .models import CurriculumNode


class NodePropertiesService:
    """Service for handling node properties."""

    def merge_properties(self, node: CurriculumNode, new_properties: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge new properties with existing properties.
        Existing keys not in the update are preserved.
        
        Args:
            node: The curriculum node to update
            new_properties: New properties to merge
            
        Returns:
            The merged properties dictionary
        """
        existing = node.properties or {}
        merged = {**existing, **new_properties}
        node.properties = merged
        return merged

    def get_required_properties(self, node_type: str) -> list:
        """
        Get required properties for a node type.
        Configured in Django settings.
        """
        required_props = getattr(settings, 'CURRICULUM_NODE_REQUIRED_PROPERTIES', {})
        return required_props.get(node_type, [])

    def validate_required_properties(self, node: CurriculumNode) -> bool:
        """
        Validate that a node has all required properties for its type.
        
        Raises:
            ValidationError: If required properties are missing
        """
        from django.core.exceptions import ValidationError
        
        required = self.get_required_properties(node.node_type)
        properties = node.properties or {}
        
        missing = [prop for prop in required if prop not in properties]
        
        if missing:
            raise ValidationError(
                f"Missing required properties for {node.node_type}: {missing}"
            )
        
        return True


class CoursePublishValidationService:
    """
    Service for validating course readiness for publishing.
    Checks assessments, weights, and mode-specific requirements.
    """
    
    def validate_for_publish(self, program) -> Dict[str, Any]:
        """
        Comprehensive validation for course publishing.
        
        Returns dict with:
            - is_valid: bool
            - errors: list of error dicts with {type, message, node_id, node_title}
            - warnings: list of warning dicts with {type, message, node_id, node_title}
            - details: detailed validation results
        """
        errors = []
        warnings = []
        details = {}

        def _normalize_assignment_mode(props):
            if not isinstance(props, dict):
                return "submission_only"
            explicit_mode = str(props.get("assignment_mode") or "").strip().lower()
            if explicit_mode in {"submission_only", "question_only", "mixed"}:
                return explicit_mode
            questions = props.get("questions", [])
            has_questions = isinstance(questions, list) and len(questions) > 0
            return "mixed" if has_questions else "submission_only"

        def _normalize_submission_type(raw_value):
            normalized = str(raw_value or "").strip().lower()
            mapping = {
                "file": "file",
                "file_upload": "file",
                "text": "text",
                "text_entry": "text",
                "both": "both",
                "external_link": "text",
                "media_recording": "text",
            }
            return mapping.get(normalized, "file")

        def _normalize_typed_response_mode(raw_value):
            normalized = str(raw_value or "").strip().lower()
            if normalized == "short_answer_question":
                return "short_answer_question"
            return "submission_text"

        def _assignment_requires_questions(mode, typed_response_mode):
            return mode in {"question_only", "mixed"} or (
                mode == "submission_only"
                and typed_response_mode == "short_answer_question"
            )

        def _assignment_requires_submission(mode, typed_response_mode):
            return mode == "mixed" or (
                mode == "submission_only"
                and typed_response_mode == "submission_text"
            )
        
        def _node_props(node):
            return node.properties if isinstance(node.properties, dict) else {}

        def _lesson_type(node):
            return str(_node_props(node).get("lesson_type") or "").strip().lower()

        def _node_type(node):
            return str(node.node_type or "").strip().lower()

        def _numeric_weight(value):
            try:
                return int(value)
            except (TypeError, ValueError):
                return 0

        # Get all curriculum nodes for this program
        nodes = list(CurriculumNode.objects.filter(program=program))
        parent_ids = {node.parent_id for node in nodes if node.parent_id}
        container_types = {
            "unit",
            "module",
            "section",
            "chapter",
            "part",
            "year",
            "term",
            "semester",
            "week",
            "topic",
            "category",
        }

        assessment_types = {"quiz", "assignment"}

        def _is_quiz(node):
            lesson_type = _lesson_type(node)
            return lesson_type == "quiz" or (
                not lesson_type and _node_type(node) == "quiz"
            )

        def _is_assignment(node):
            lesson_type = _lesson_type(node)
            return lesson_type == "assignment" or (
                not lesson_type and _node_type(node) == "assignment"
            )

        def _is_content_lesson(node):
            if _is_quiz(node) or _is_assignment(node):
                return False
            if node.id in parent_ids:
                return False
            lesson_type = _lesson_type(node)
            node_type = _node_type(node)
            if lesson_type and lesson_type not in assessment_types:
                return True
            return node_type in {"lesson", "session"} or node_type not in container_types

        # Count node types by the canonical Builder payload first.
        lessons = [n for n in nodes if _is_content_lesson(n)]
        quizzes = [n for n in nodes if _is_quiz(n)]
        assignments = [n for n in nodes if _is_assignment(n)]

        details['lesson_count'] = len(lessons)
        details['quiz_count'] = len(quizzes)
        details['assignment_count'] = len(assignments)

        from django.utils.html import strip_tags

        from apps.assessments.models import Assignment, Quiz
        from apps.progression.models import InstructorAssignment

        has_instructor = InstructorAssignment.objects.filter(program=program).exists()
        has_description = bool(strip_tags(str(program.description or "")).strip())
        has_thumbnail = bool(program.thumbnail)
        learning_outcome_items = getattr(program, "what_you_learn_items", None) or []
        has_learning_outcomes = bool(learning_outcome_items) or bool(
            strip_tags(str(getattr(program, "what_you_learn_html", "") or "")).strip()
        )
        details["metadata"] = {
            "has_instructor": has_instructor,
            "has_description": has_description,
            "has_thumbnail": has_thumbnail,
            "has_learning_outcomes": has_learning_outcomes,
        }

        if not has_instructor:
            errors.append({
                'type': 'missing_instructor',
                'message': 'Course must have at least one assigned instructor',
                'node_id': None,
                'node_title': None
            })

        if not has_description:
            errors.append({
                'type': 'missing_description',
                'message': 'Course must have a public course description',
                'node_id': None,
                'node_title': None
            })

        if not has_thumbnail:
            errors.append({
                'type': 'missing_thumbnail',
                'message': 'Course must have a thumbnail image',
                'node_id': None,
                'node_title': None
            })

        if not has_learning_outcomes:
            errors.append({
                'type': 'missing_learning_outcomes',
                'message': "Course must explain what learners will learn",
                'node_id': None,
                'node_title': None
            })
        
        # Basic content check
        if len(lessons) == 0:
            errors.append({
                'type': 'missing_content',
                'message': 'Course must have at least 1 lesson',
                'node_id': None,
                'node_title': None
            })
        
        # Assessment requirements
        total_assessments = len(quizzes) + len(assignments)
        details['total_assessments'] = total_assessments
        
        if total_assessments == 0:
            errors.append({
                'type': 'missing_assessment',
                'message': 'Course must have at least 1 quiz or assignment',
                'node_id': None,
                'node_title': None
            })
        
        quiz_records = {
            quiz.node_id: quiz
            for quiz in Quiz.objects.filter(node__in=quizzes).only("id", "node_id", "weight")
        }
        assignment_ids = [
            _node_props(assignment).get("assignment_id")
            for assignment in assignments
            if _node_props(assignment).get("assignment_id")
        ]
        assignment_records = {
            assignment.id: assignment
            for assignment in Assignment.objects.filter(id__in=assignment_ids).only(
                "id", "weight"
            )
        }

        quiz_weights = []
        for quiz in quizzes:
            props = _node_props(quiz)
            quiz_record = quiz_records.get(quiz.id)
            weight = _numeric_weight(
                props.get("weight")
                if props.get("weight") not in (None, "")
                else getattr(quiz_record, "weight", 0)
            )
            quiz_weights.append({
                'id': quiz.id,
                'title': quiz.title,
                'weight': weight
            })
            if weight == 0:
                warnings.append({
                    'type': 'missing_weight',
                    'message': 'Quiz has no weight set',
                    'node_id': quiz.id,
                    'node_title': quiz.title
                })
            if quiz_record:
                from apps.assessments.question_snapshots import (
                    validate_quiz_question_pools,
                )

                for issue in validate_quiz_question_pools(quiz_record):
                    errors.append(
                        {
                            'type': 'undersupplied_question_pool',
                            'message': (
                                f'Question bank "{issue["bankName"]}" requires '
                                f'{issue["required"]} unique questions but only '
                                f'{issue["available"]} are available'
                            ),
                            'node_id': quiz.id,
                            'node_title': quiz.title,
                            'pool_id': issue['poolId'],
                        }
                    )

        # Weight validation and integrity checks for assignments.
        assignment_weights = []
        for assignment in assignments:
            props = _node_props(assignment)
            assignment_record = assignment_records.get(props.get("assignment_id"))
            weight = _numeric_weight(
                props.get("weight")
                if props.get("weight") not in (None, "")
                else getattr(assignment_record, "weight", 0)
            )
            assignment_weights.append({
                'id': assignment.id,
                'title': assignment.title,
                'weight': weight
            })
            # Check individual assignment has weight set
            if weight == 0:
                warnings.append({
                    'type': 'missing_weight',
                    'message': f'Assignment has no weight set',
                    'node_id': assignment.id,
                    'node_title': assignment.title
                })

            assignment_mode = _normalize_assignment_mode(props)
            typed_response_mode = _normalize_typed_response_mode(
                props.get("typed_response_mode")
            )
            questions = props.get("questions", [])
            has_questions = isinstance(questions, list) and len(questions) > 0
            quiz_id = props.get("quiz_id")
            assignment_id = props.get("assignment_id")
            assessment_prompt = str(props.get("assessment_prompt") or "").strip()

            if not assessment_prompt:
                errors.append(
                    {
                        "type": "missing_assessment_prompt",
                        "message": "Assignment requires an assessment prompt",
                        "node_id": assignment.id,
                        "node_title": assignment.title,
                    }
                )

            raw_submission_type = str(props.get("submission_type") or "").strip().lower()
            normalized_submission_type = _normalize_submission_type(raw_submission_type)
            if (
                _assignment_requires_submission(assignment_mode, typed_response_mode)
                and raw_submission_type
                and raw_submission_type != normalized_submission_type
            ):
                errors.append(
                    {
                        "type": "invalid_submission_type_mapping",
                        "message": (
                            f"Assignment submission type '{raw_submission_type}' must be canonical "
                            f"({normalized_submission_type})"
                        ),
                        "node_id": assignment.id,
                        "node_title": assignment.title,
                    }
                )

            if _assignment_requires_questions(assignment_mode, typed_response_mode):
                if not has_questions:
                    errors.append(
                        {
                            "type": "invalid_assignment_mode_config",
                            "message": "Assignment mode requires questions, but no questions were found",
                            "node_id": assignment.id,
                            "node_title": assignment.title,
                        }
                    )
                if not quiz_id:
                    errors.append(
                        {
                            "type": "missing_assignment_question_link",
                            "message": "Assignment has questions but no linked question engine record",
                            "node_id": assignment.id,
                            "node_title": assignment.title,
                        }
                    )

            if _assignment_requires_submission(assignment_mode, typed_response_mode):
                if not assignment_id:
                    errors.append(
                        {
                            "type": "invalid_assignment_mode_config",
                            "message": "Assignment mode requires assignment submission settings, but assignment link is missing",
                            "node_id": assignment.id,
                            "node_title": assignment.title,
                        }
                    )
                if normalized_submission_type not in {"file", "text", "both"}:
                    errors.append(
                        {
                            "type": "invalid_submission_type_mapping",
                            "message": "Assignment submission type must be one of file/text/both",
                            "node_id": assignment.id,
                            "node_title": assignment.title,
                        }
                    )
        
        quiz_weight = sum(q['weight'] for q in quiz_weights)
        assignment_weight = sum(a['weight'] for a in assignment_weights)
        total_weight = quiz_weight + assignment_weight
        details['quiz_weights'] = quiz_weights
        details['quiz_weight'] = quiz_weight
        details['assignment_weights'] = assignment_weights
        details['assignment_weight'] = assignment_weight
        details['total_assessment_weight'] = total_weight
        
        # Keep mode in details for existing UI/debug output, but publish readiness
        # uses the same assessment rule for every course.
        mode = getattr(program, 'mode', None) or 'online'
        details['mode'] = mode
        
        if total_assessments > 0 and total_weight != 100:
            errors.append({
                'type': 'invalid_weight_sum',
                'message': f'Quiz and assignment weights must sum to 100% (currently {total_weight}%)',
                'node_id': None,
                'node_title': None
            })
        
        # Check for incomplete quizzes (no questions)
        incomplete_quizzes = []
        unlinked_quizzes = []
        for quiz in quizzes:
            quiz_props = quiz.properties or {}
            questions = quiz_props.get('questions', [])
            quiz_id = quiz_props.get('quiz_id')
            if len(questions) == 0:
                incomplete_quizzes.append({'id': quiz.id, 'title': quiz.title})
                errors.append({
                    'type': 'empty_quiz',
                    'message': f'Quiz has no questions',
                    'node_id': quiz.id,
                    'node_title': quiz.title
                })
            elif not quiz_id:
                unlinked_quizzes.append({'id': quiz.id, 'title': quiz.title})
                errors.append({
                    'type': 'missing_quiz_link',
                    'message': 'Quiz has questions but no linked assessment record',
                    'node_id': quiz.id,
                    'node_title': quiz.title
                })
        
        details['incomplete_quizzes'] = incomplete_quizzes
        details['unlinked_quizzes'] = unlinked_quizzes
        
        # Check for incomplete assignments (no instructions)
        incomplete_assignments = []
        for assignment in assignments:
            instructions = (assignment.properties or {}).get('instructions', '')
            if len(instructions) < 100:
                incomplete_assignments.append({'id': assignment.id, 'title': assignment.title})
                warnings.append({
                    'type': 'short_instructions',
                    'message': f'Assignment has short instructions ({len(instructions)}/100 chars)',
                    'node_id': assignment.id,
                    'node_title': assignment.title
                })
        
        details['incomplete_assignments'] = incomplete_assignments

        # Check document lessons (primary document + strict tracking readiness)
        media_root_abs = os.path.abspath(settings.MEDIA_ROOT)
        document_lessons = []
        invalid_document_lessons = []
        for lesson in nodes:
            lesson_props = lesson.properties if isinstance(lesson.properties, dict) else {}
            lesson_type = str(lesson_props.get("lesson_type") or "").lower()
            if lesson_type != "document":
                continue

            document_lessons.append({"id": lesson.id, "title": lesson.title})
            document = lesson_props.get("document")
            if not isinstance(document, dict):
                errors.append(
                    {
                        "type": "missing_document",
                        "message": "Document lesson has no primary document uploaded",
                        "node_id": lesson.id,
                        "node_title": lesson.title,
                    }
                )
                invalid_document_lessons.append(
                    {"id": lesson.id, "title": lesson.title, "reason": "missing_document"}
                )
                continue

            primary_document_url = str(document.get("original_url") or "").strip()
            primary_document_path = str(document.get("original_path") or "").strip()
            if not primary_document_url and not primary_document_path:
                errors.append(
                    {
                        "type": "missing_document",
                        "message": "Document lesson has no primary document uploaded",
                        "node_id": lesson.id,
                        "node_title": lesson.title,
                    }
                )
                invalid_document_lessons.append(
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "reason": "missing_primary_document",
                    }
                )
                continue

            strict_value = document.get("strict_completion", True)
            if isinstance(strict_value, str):
                strict_completion = strict_value.strip().lower() in {"true", "1", "yes", "on"}
            else:
                strict_completion = bool(strict_value)
            if not strict_completion:
                continue

            conversion_status = str(document.get("conversion_status") or "").lower()
            viewer_pdf_path = str(document.get("viewer_pdf_path") or "").strip()
            page_count_raw = document.get("page_count")
            try:
                page_count = int(page_count_raw)
            except (TypeError, ValueError):
                page_count = 0

            if conversion_status != "ready":
                errors.append(
                    {
                        "type": "document_conversion_not_ready",
                        "message": "Document lesson conversion is not ready for strict completion",
                        "node_id": lesson.id,
                        "node_title": lesson.title,
                    }
                )
                invalid_document_lessons.append(
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "reason": "conversion_not_ready",
                    }
                )

            if not viewer_pdf_path:
                errors.append(
                    {
                        "type": "document_pdf_missing",
                        "message": "Document lesson is missing a tracked PDF file",
                        "node_id": lesson.id,
                        "node_title": lesson.title,
                    }
                )
                invalid_document_lessons.append(
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "reason": "viewer_pdf_missing",
                    }
                )
            else:
                pdf_abs_path = os.path.abspath(
                    os.path.join(settings.MEDIA_ROOT, viewer_pdf_path.lstrip("/"))
                )
                try:
                    pdf_in_media_root = (
                        os.path.commonpath([media_root_abs, pdf_abs_path]) == media_root_abs
                    )
                except ValueError:
                    pdf_in_media_root = False

                if not pdf_in_media_root:
                    errors.append(
                        {
                            "type": "document_pdf_invalid_path",
                            "message": "Document lesson tracked PDF path is outside media storage",
                            "node_id": lesson.id,
                            "node_title": lesson.title,
                        }
                    )
                    invalid_document_lessons.append(
                        {
                            "id": lesson.id,
                            "title": lesson.title,
                            "reason": "viewer_pdf_path_outside_media_root",
                        }
                    )
                elif not os.path.exists(pdf_abs_path):
                    errors.append(
                        {
                            "type": "document_pdf_not_found",
                            "message": "Document lesson tracked PDF file is missing on disk",
                            "node_id": lesson.id,
                            "node_title": lesson.title,
                        }
                    )
                    invalid_document_lessons.append(
                        {
                            "id": lesson.id,
                            "title": lesson.title,
                            "reason": "viewer_pdf_not_found",
                        }
                    )

            if page_count <= 0:
                errors.append(
                    {
                        "type": "document_page_count_invalid",
                        "message": "Document lesson has invalid page count for strict completion",
                        "node_id": lesson.id,
                        "node_title": lesson.title,
                    }
                )
                invalid_document_lessons.append(
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "reason": "invalid_page_count",
                    }
                )

        details["document_lessons"] = document_lessons
        details["invalid_document_lessons"] = invalid_document_lessons

        from django.core.exceptions import ValidationError
        from django.utils import timezone

        from apps.learning_operations.services import get_course_delivery_profile
        from apps.live_sessions.models import ScheduledLearningSession
        from apps.live_sessions.services import (
            SCHEDULED_ACTIVITY_TYPES,
            validate_session_properties,
        )

        session_nodes = [node for node in lessons if _lesson_type(node) in SCHEDULED_ACTIVITY_TYPES]
        sessions = {
            session.node_id: session
            for session in ScheduledLearningSession.objects.filter(
                node_id__in=[node.id for node in session_nodes]
            )
        }
        for session_node in session_nodes:
            session = sessions.get(session_node.id)
            if not session:
                errors.append(
                    {
                        "type": "missing_scheduled_session",
                        "message": "Scheduled lesson is missing its date, time, provider, or location",
                        "node_id": session_node.id,
                        "node_title": session_node.title,
                    }
                )
                continue
            try:
                validate_session_properties(session_node.properties)
            except ValidationError as exc:
                errors.append(
                    {
                        "type": "invalid_scheduled_session",
                        "message": exc.messages[0],
                        "node_id": session_node.id,
                        "node_title": session_node.title,
                    }
                )

        future_sessions = [
            session
            for session in sessions.values()
            if session.status == ScheduledLearningSession.Status.SCHEDULED
            and session.ends_at >= timezone.now()
        ]
        has_live_online_session = any(
            session.kind
            in {
                ScheduledLearningSession.Kind.LIVE_MEETING,
                ScheduledLearningSession.Kind.LIVE_STREAM,
            }
            for session in future_sessions
        )
        has_physical_session = any(
            session.kind == ScheduledLearningSession.Kind.IN_PERSON
            for session in future_sessions
        )
        has_online_content = any(
            _lesson_type(node) not in SCHEDULED_ACTIVITY_TYPES for node in lessons
        ) or bool(quizzes or assignments)
        delivery_mode = get_course_delivery_profile(program).delivery_mode
        if delivery_mode == "live_online" and not has_live_online_session:
            warnings.append(
                {
                    "type": "delivery_readiness",
                    "message": "Live-online course has no upcoming meeting or stream yet",
                    "node_id": None,
                    "node_title": None,
                }
            )
        elif delivery_mode == "blended":
            if not has_online_content:
                warnings.append(
                    {
                        "type": "delivery_readiness",
                        "message": "Blended course has no independent online content yet",
                        "node_id": None,
                        "node_title": None,
                    }
                )
            if not (has_live_online_session or has_physical_session):
                warnings.append(
                    {
                        "type": "delivery_readiness",
                        "message": "Blended course has no upcoming live or physical session yet",
                        "node_id": None,
                        "node_title": None,
                    }
                )
        elif delivery_mode == "in_person" and not has_physical_session:
            warnings.append(
                {
                    "type": "delivery_readiness",
                    "message": "In-person course has no upcoming physical session yet",
                    "node_id": None,
                    "node_title": None,
                }
            )
        elif delivery_mode == "self_paced" and future_sessions:
            warnings.append(
                {
                    "type": "delivery_readiness",
                    "message": "Self-paced course includes required scheduled attendance",
                    "node_id": None,
                    "node_title": None,
                }
            )
        details["delivery_readiness"] = {
            "mode": delivery_mode,
            "hasOnlineContent": has_online_content,
            "hasLiveOnlineSession": has_live_online_session,
            "hasPhysicalSession": has_physical_session,
        }
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'details': details
        }
    
    def get_publish_summary(self, program) -> str:
        """
        Get a human-readable summary of publish readiness.
        """
        result = self.validate_for_publish(program)
        
        if result['is_valid']:
            return f"✓ Ready to publish ({result['details']['lesson_count']} lessons, {result['details']['total_assessments']} assessments)"
        else:
            first_error = result['errors'][0]
            return f"✗ Not ready: {first_error['message']}"
