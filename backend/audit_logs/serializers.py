from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'target', 'created_at', 'metadata']
        read_only_fields = ['id', 'user', 'created_at']
