from rest_framework import serializers
from .models import ContentBlock
from django.core.exceptions import ValidationError

class ContentBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentBlock
        fields = ['id', 'node', 'block_type', 'position', 'data', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        """
        Validate 'data' field based on 'block_type'.
        """
        block_type = attrs.get('block_type')
        data = attrs.get('data', {})
        
        # If updating, merge with existing data? 
        # For now, assume full replacement or the view handles partial updates.
        
        if block_type == 'VIDEO':
            self._validate_video(data)
        elif block_type == 'QUIZ':
            self._validate_quiz(data)
        elif block_type == 'ASSIGNMENT':
            self._validate_assignment(data)
        elif block_type == 'RICHTEXT':
            self._validate_richtext(data)
        elif block_type == 'DOCUMENT':
            self._validate_document(data)
            
        return attrs

    def _validate_video(self, data):
        url = data.get('url')
        if not url:
            raise serializers.ValidationError({"data": "Video block requires a 'url' field."})
        # Basic URL validation could go here or rely on frontend/provider check
        
    def _validate_quiz(self, data):
        quiz_id = data.get('quiz_id')
        if not quiz_id:
            raise serializers.ValidationError({"data": "Quiz block requires a 'quiz_id'."})
        # TODO: Verify Quiz exists (imported lazily to avoid circular deps)
        
    def _validate_assignment(self, data):
        assignment_id = data.get('assignment_id')
        if not assignment_id:
            raise serializers.ValidationError({"data": "Assignment block requires an 'assignment_id'."})
            
    def _validate_richtext(self, data):
        # 'html' is optional but recommended. strict validation might be annoying.
        pass

    def _validate_document(self, data):
        file_path = data.get('file_path')
        if not file_path:
            raise serializers.ValidationError({"data": "Document block requires a 'file_path'."})
