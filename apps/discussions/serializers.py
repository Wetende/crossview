from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DiscussionThread, DiscussionPost

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name'] # Add avatar if available

class DiscussionPostSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionPost
        fields = ['id', 'thread', 'user', 'content', 'parent', 'created_at', 'updated_at', 'is_owner']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'is_owner']

    def get_is_owner(self, obj):
        request = self.context.get('request')
        return request.user == obj.user if request else False

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)

class DiscussionThreadSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    posts_count = serializers.IntegerField(source='posts.count', read_only=True)
    latest_post_at = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionThread
        fields = ['id', 'node', 'user', 'title', 'content', 'is_pinned', 'is_locked', 'created_at', 'updated_at', 'posts_count', 'latest_post_at', 'is_owner']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'posts_count', 'latest_post_at', 'is_owner']

    def get_latest_post_at(self, obj):
        latest = obj.posts.order_by('-created_at').first()
        return latest.created_at if latest else obj.created_at

    def get_is_owner(self, obj):
        request = self.context.get('request')
        return request.user == obj.user if request else False
        
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)
