"""
Legacy Migration Service - Migrates data from old Course/Section/Lesson structure
to the new Blueprint/CurriculumNode structure.
"""
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from django.db import transaction

from .models import AcademicBlueprint
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode


@dataclass
class MigrationReport:
    """Report of migration results."""
    courses_migrated: int = 0
    sections_migrated: int = 0
    lessons_migrated: int = 0
    errors: List[str] = field(default_factory=list)
    
    def add_error(self, error: str):
        self.errors.append(error)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'courses_migrated': self.courses_migrated,
            'sections_migrated': self.sections_migrated,
            'lessons_migrated': self.lessons_migrated,
            'total_nodes': self.courses_migrated + self.sections_migrated + self.lessons_migrated,
            'errors': self.errors,
            'success': len(self.errors) == 0
        }


class LegacyMigrationService:
    """Service for migrating legacy course data to blueprint structure."""

    def __init__(self):
        self.report = MigrationReport()
        self.blueprint: Optional[AcademicBlueprint] = None
        self.dry_run = False

    def create_default_theology_blueprint(self) -> AcademicBlueprint:
        """
        Create the default theology blueprint with hierarchy:
        ["Course", "Section", "Lesson"]
        """
        blueprint = AcademicBlueprint(
            name="Theology Program Blueprint",
            description="Default blueprint for theology courses with Course > Section > Lesson hierarchy",
            hierarchy_structure=["Course", "Section", "Lesson"],
            grading_logic={
                "type": "weighted",
                "components": [
                    {"name": "assignments", "weight": 30},
                    {"name": "quizzes", "weight": 20},
                    {"name": "exams", "weight": 50}
                ]
            },
            progression_rules={
                "require_completion": True,
                "min_score": 70
            },
            gamification_enabled=False,
            certificate_enabled=True
        )
        
        if not self.dry_run:
            blueprint.save()
        
        self.blueprint = blueprint
        return blueprint

    def migrate_course_to_node(
        self,
        course_data: Dict[str, Any],
        program: Program
    ) -> CurriculumNode:
        """
        Migrate a course record to a root CurriculumNode.
        
        Args:
            course_data: Dictionary with course fields
            program: The program to attach the node to
            
        Returns:
            Created CurriculumNode
        """
        properties = {
            'original_id': course_data.get('id'),
            'thumbnail': course_data.get('thumbnail'),
            'duration': course_data.get('duration'),
            'level': course_data.get('level'),
            'price': course_data.get('price'),
            'instructor_id': course_data.get('instructor_id'),
        }
        # Remove None values
        properties = {k: v for k, v in properties.items() if v is not None}
        
        node = CurriculumNode(
            program=program,
            parent=None,
            node_type="Course",
            title=course_data.get('title', 'Untitled Course'),
            code=course_data.get('code'),
            description=course_data.get('description'),
            properties=properties,
            position=course_data.get('position', 0),
            is_published=course_data.get('is_published', False)
        )
        
        if not self.dry_run:
            node.save(skip_validation=True)
        
        self.report.courses_migrated += 1
        return node

    def migrate_section_to_node(
        self,
        section_data: Dict[str, Any],
        parent_node: CurriculumNode,
        program: Program
    ) -> CurriculumNode:
        """
        Migrate a section record to a child CurriculumNode.
        
        Args:
            section_data: Dictionary with section fields
            parent_node: The parent course node
            program: The program
            
        Returns:
            Created CurriculumNode
        """
        properties = {
            'original_id': section_data.get('id'),
            'original_course_id': section_data.get('course_id'),
        }
        properties = {k: v for k, v in properties.items() if v is not None}
        
        node = CurriculumNode(
            program=program,
            parent=parent_node,
            node_type="Section",
            title=section_data.get('title', 'Untitled Section'),
            code=section_data.get('code'),
            description=section_data.get('description'),
            properties=properties,
            position=section_data.get('position', 0),
            is_published=section_data.get('is_published', True)
        )
        
        if not self.dry_run:
            node.save(skip_validation=True)
        
        self.report.sections_migrated += 1
        return node

    def migrate_lesson_to_node(
        self,
        lesson_data: Dict[str, Any],
        parent_node: CurriculumNode,
        program: Program
    ) -> CurriculumNode:
        """
        Migrate a lesson record to a child CurriculumNode.
        Preserves video_url, content, and attachments in properties.
        
        Args:
            lesson_data: Dictionary with lesson fields
            parent_node: The parent section node
            program: The program
            
        Returns:
            Created CurriculumNode
        """
        properties = {
            'original_id': lesson_data.get('id'),
            'original_section_id': lesson_data.get('section_id'),
            'video_url': lesson_data.get('video_url'),
            'content': lesson_data.get('content'),
            'attachments': lesson_data.get('attachments', []),
            'duration_minutes': lesson_data.get('duration'),
            'is_preview': lesson_data.get('is_preview', False),
        }
        properties = {k: v for k, v in properties.items() if v is not None}
        
        completion_rules = {}
        if lesson_data.get('video_url'):
            completion_rules['require_video_watch'] = True
        if lesson_data.get('has_quiz'):
            completion_rules['require_quiz_pass'] = True
        
        node = CurriculumNode(
            program=program,
            parent=parent_node,
            node_type="Lesson",
            title=lesson_data.get('title', 'Untitled Lesson'),
            code=lesson_data.get('code'),
            description=lesson_data.get('description'),
            properties=properties,
            completion_rules=completion_rules,
            position=lesson_data.get('position', 0),
            is_published=lesson_data.get('is_published', True)
        )
        
        if not self.dry_run:
            node.save(skip_validation=True)
        
        self.report.lessons_migrated += 1
        return node

    @transaction.atomic
    def migrate_full_structure(
        self,
        courses: List[Dict[str, Any]],
        sections: List[Dict[str, Any]],
        lessons: List[Dict[str, Any]],
        program: Program,
        dry_run: bool = False
    ) -> MigrationReport:
        """
        Migrate a complete course structure to curriculum nodes.
        
        Args:
            courses: List of course data dictionaries
            sections: List of section data dictionaries
            lessons: List of lesson data dictionaries
            program: The program to migrate to
            dry_run: If True, don't actually save to database
            
        Returns:
            MigrationReport with results
        """
        self.dry_run = dry_run
        self.report = MigrationReport()
        
        # Create blueprint if needed
        if not self.blueprint:
            self.create_default_theology_blueprint()
        
        # Assign blueprint to program
        if not dry_run:
            program.blueprint = self.blueprint
            program.save()
        
        # Build lookup maps
        course_nodes = {}  # original_id -> node
        section_nodes = {}  # original_id -> node
        
        # Migrate courses
        for course_data in courses:
            try:
                node = self.migrate_course_to_node(course_data, program)
                course_nodes[course_data.get('id')] = node
            except Exception as e:
                self.report.add_error(f"Failed to migrate course {course_data.get('id')}: {e}")
        
        # Migrate sections
        for section_data in sections:
            try:
                course_id = section_data.get('course_id')
                parent_node = course_nodes.get(course_id)
                if not parent_node:
                    self.report.add_error(f"Section {section_data.get('id')} has invalid course_id {course_id}")
                    continue
                node = self.migrate_section_to_node(section_data, parent_node, program)
                section_nodes[section_data.get('id')] = node
            except Exception as e:
                self.report.add_error(f"Failed to migrate section {section_data.get('id')}: {e}")
        
        # Migrate lessons
        for lesson_data in lessons:
            try:
                section_id = lesson_data.get('section_id')
                parent_node = section_nodes.get(section_id)
                if not parent_node:
                    self.report.add_error(f"Lesson {lesson_data.get('id')} has invalid section_id {section_id}")
                    continue
                self.migrate_lesson_to_node(lesson_data, parent_node, program)
            except Exception as e:
                self.report.add_error(f"Failed to migrate lesson {lesson_data.get('id')}: {e}")
        
        return self.report

    def rollback_migration(self, program: Program):
        """
        Rollback a migration by deleting all curriculum nodes for a program.
        """
        CurriculumNode.objects.filter(program=program).delete()
        program.blueprint = None
        program.save()
