from rest_framework import serializers

from .models import ChatHistory


class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = ['id', 'query', 'response', 'context', 'created_at']
