from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import ValidationReport
from .serializers import ValidationReportSerializer
from .services import validate_document
from audit_logs.services import record_audit
from uploads.models import UploadedDocument


class ValidationReportListView(generics.ListAPIView):
    queryset = ValidationReport.objects.all().order_by('-created_at')
    serializer_class = ValidationReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ValidationReport.objects.filter(document__owner=self.request.user)


class ProcessDocumentView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        document_id = request.data.get('document_id')
        if not document_id:
            return Response({'detail': 'document_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            document = UploadedDocument.objects.get(id=document_id, owner=request.user)
        except UploadedDocument.DoesNotExist:
            return Response({'detail': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        report = validate_document(document)
        record_audit(
            request.user,
            'document_validated',
            target=document.name,
            metadata={'document_id': document.id, 'report_id': report.id, 'score': report.score},
        )
        serializer = ValidationReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)
