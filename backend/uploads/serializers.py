from rest_framework import serializers

from .models import UploadedDocument


class UploadedDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedDocument
        fields = ['id', 'owner', 'name', 'file', 'uploaded_at', 'processed', 'metadata']
        read_only_fields = ['id', 'owner', 'name', 'uploaded_at', 'processed', 'metadata']

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        validated_data['name'] = validated_data['file'].name
        return super().create(validated_data)
