"""
Property tests for Legacy Migration.

**Feature: blueprint-engine, Property 11: Migration Structure Preservation**
**Feature: blueprint-engine, Property 12: Migration Content Preservation**
**Validates: Requirements 6.2, 6.3, 6.4, 6.5**

Tests that migration preserves structure and content.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.blueprints.models import AcademicBlueprint
from apps.blueprints.legacy_migration import LegacyMigrationService, MigrationReport
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode


@pytest.mark.django_db(transaction=True)
class TestMigrationStructurePreservation:
    """
    Property 11: Migration Structure Preservation
    
    *For any* course/section/lesson structure, migration should preserve
    the hierarchical relationships.
    """

    @given(
        num_courses=st.integers(min_value=1, max_value=3),
        sections_per_course=st.integers(min_value=1, max_value=3),
        lessons_per_section=st.integers(min_value=1, max_value=3)
    )
    @hyp_settings(max_examples=10, deadline=None)
    def test_migration_preserves_hierarchy(self, num_courses, sections_per_course, lessons_per_section):
        """
        **Feature: blueprint-engine, Property 11: Migration Structure Preservation**
        **Validates: Requirements 6.2, 6.3, 6.4**
        
        For any structure, migration should preserve parent-child relationships.
        """
        # Setup for each hypothesis example
        program = Program.objects.create(name="Test Program")
        service = LegacyMigrationService()
        
        try:
            # Generate test data
            courses = []
            sections = []
            lessons = []
            
            section_id = 1
            lesson_id = 1
            
            for course_id in range(1, num_courses + 1):
                courses.append({
                    'id': course_id,
                    'title': f'Course {course_id}',
                    'description': f'Description for course {course_id}',
                    'position': course_id - 1,
                    'is_published': True
                })
                
                for s in range(sections_per_course):
                    sections.append({
                        'id': section_id,
                        'course_id': course_id,
                        'title': f'Section {section_id}',
                        'position': s
                    })
                    
                    for l in range(lessons_per_section):
                        lessons.append({
                            'id': lesson_id,
                            'section_id': section_id,
                            'title': f'Lesson {lesson_id}',
                            'video_url': f'https://example.com/video{lesson_id}',
                            'content': f'Content for lesson {lesson_id}',
                            'position': l
                        })
                        lesson_id += 1
                    
                    section_id += 1
            
            # Run migration
            report = service.migrate_full_structure(
                courses, sections, lessons, program
            )
            
            # Verify counts
            assert report.courses_migrated == num_courses
            assert report.sections_migrated == num_courses * sections_per_course
            assert report.lessons_migrated == num_courses * sections_per_course * lessons_per_section
            
            # Verify hierarchy
            course_nodes = CurriculumNode.objects.filter(
                program=program, node_type="Course"
            )
            assert course_nodes.count() == num_courses
            
            for course_node in course_nodes:
                assert course_node.parent is None
                section_nodes = course_node.children.all()
                assert section_nodes.count() == sections_per_course
                
                for section_node in section_nodes:
                    assert section_node.parent == course_node
                    lesson_nodes = section_node.children.all()
                    assert lesson_nodes.count() == lessons_per_section
        finally:
            # Cleanup
            CurriculumNode.objects.filter(program=program).delete()
            if program.blueprint:
                blueprint = program.blueprint
                program.blueprint = None
                program.save()
                blueprint.delete()
            program.delete()

    def test_migration_creates_blueprint(self):
        """Migration should create a default blueprint."""
        program = Program.objects.create(name="Test Program")
        service = LegacyMigrationService()
        
        try:
            courses = [{'id': 1, 'title': 'Test Course', 'position': 0}]
            sections = [{'id': 1, 'course_id': 1, 'title': 'Test Section', 'position': 0}]
            lessons = [{'id': 1, 'section_id': 1, 'title': 'Test Lesson', 'position': 0}]
            
            service.migrate_full_structure(courses, sections, lessons, program)
            
            program.refresh_from_db()
            assert program.blueprint is not None
            assert program.blueprint.hierarchy_structure == ["Course", "Section", "Lesson"]
        finally:
            CurriculumNode.objects.filter(program=program).delete()
            if program.blueprint:
                blueprint = program.blueprint
                program.blueprint = None
                program.save()
                blueprint.delete()
            program.delete()


@pytest.mark.django_db(transaction=True)
class TestMigrationContentPreservation:
    """
    Property 12: Migration Content Preservation
    
    *For any* lesson with video_url, content, and attachments,
    migration should preserve these in the properties JSON.
    """

    @given(
        video_url=st.text(min_size=10, max_size=200, alphabet=st.characters(whitelist_categories=('L', 'N'))),
        content=st.text(min_size=1, max_size=1000),
        attachments=st.lists(st.text(min_size=5, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N'))), min_size=1, max_size=5)
    )
    @hyp_settings(max_examples=20, deadline=None)
    def test_lesson_content_preserved_in_properties(self, video_url, content, attachments):
        """
        **Feature: blueprint-engine, Property 12: Migration Content Preservation**
        **Validates: Requirements 6.5**
        
        For any lesson, video_url, content, and attachments should be in properties.
        """
        program = Program.objects.create(name="Test Program")
        service = LegacyMigrationService()
        
        try:
            courses = [{'id': 1, 'title': 'Test Course', 'position': 0}]
            sections = [{'id': 1, 'course_id': 1, 'title': 'Test Section', 'position': 0}]
            lessons = [{
                'id': 1,
                'section_id': 1,
                'title': 'Test Lesson',
                'video_url': video_url,
                'content': content,
                'attachments': attachments,
                'position': 0
            }]
            
            service.migrate_full_structure(courses, sections, lessons, program)
            
            lesson_node = CurriculumNode.objects.get(
                program=program, node_type="Lesson"
            )
            
            assert lesson_node.properties.get('video_url') == video_url
            assert lesson_node.properties.get('content') == content
            assert lesson_node.properties.get('attachments') == attachments
        finally:
            CurriculumNode.objects.filter(program=program).delete()
            if program.blueprint:
                blueprint = program.blueprint
                program.blueprint = None
                program.save()
                blueprint.delete()
            program.delete()

    def test_dry_run_does_not_save(self):
        """Dry run should not create any records."""
        program = Program.objects.create(name="Test Program")
        service = LegacyMigrationService()
        
        try:
            courses = [{'id': 1, 'title': 'Test Course', 'position': 0}]
            sections = [{'id': 1, 'course_id': 1, 'title': 'Test Section', 'position': 0}]
            lessons = [{'id': 1, 'section_id': 1, 'title': 'Test Lesson', 'position': 0}]
            
            report = service.migrate_full_structure(
                courses, sections, lessons, program, dry_run=True
            )
            
            # Report should show counts
            assert report.courses_migrated == 1
            assert report.sections_migrated == 1
            assert report.lessons_migrated == 1
            
            # But no nodes should be created
            assert CurriculumNode.objects.filter(program=program).count() == 0
        finally:
            program.delete()
