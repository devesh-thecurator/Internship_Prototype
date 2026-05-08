from rest_framework import serializers

from .models import ExportActivity


class ExportActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportActivity
        fields = ['id', 'report_id', 'export_type', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']
