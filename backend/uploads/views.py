from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser

from .models import UploadedDocument
from .serializers import UploadedDocumentSerializer
from audit_logs.services import record_audit


class UploadedDocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = UploadedDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return UploadedDocument.objects.filter(owner=self.request.user).order_by('-uploaded_at')

    def perform_create(self, serializer):
        document = serializer.save()
        record_audit(
            self.request.user,
            'document_uploaded',
            target=document.name,
            metadata={'document_id': document.id},
        )


class UploadedDocumentDetailView(generics.RetrieveAPIView):
    serializer_class = UploadedDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UploadedDocument.objects.filter(owner=self.request.user)
