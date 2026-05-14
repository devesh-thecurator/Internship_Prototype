import json
import logging
import queue
import threading

from django.core.serializers.json import DjangoJSONEncoder
from django.db import close_old_connections
from django.http import StreamingHttpResponse
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UploadedDocument
from .serializers import UploadedDocumentSerializer
from audit_logs.services import record_audit
from validation_engine.serializers import ValidationReportSerializer
from validation_engine.services import validate_document

logger = logging.getLogger(__name__)


def encode_stream_event(payload):
    return f'{json.dumps(payload, cls=DjangoJSONEncoder)}\n'


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
        return document

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = self.perform_create(serializer)
        report = validate_document(document)
        record_audit(
            request.user,
            'document_auto_validated',
            target=document.name,
            metadata={'document_id': document.id, 'report_id': report.id, 'score': report.score},
        )
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'document': UploadedDocumentSerializer(document, context=self.get_serializer_context()).data,
                'validation_report': ValidationReportSerializer(report).data,
            },
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class UploadedDocumentDetailView(generics.RetrieveAPIView):
    serializer_class = UploadedDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UploadedDocument.objects.filter(owner=self.request.user)


class UploadValidationStreamView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = UploadedDocumentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        document_payload = UploadedDocumentSerializer(document, context={'request': request}).data

        record_audit(
            request.user,
            'document_uploaded',
            target=document.name,
            metadata={'document_id': document.id, 'streaming': True},
        )

        events = queue.Queue()

        def publish(payload):
            events.put(payload)

        def worker():
            close_old_connections()
            try:
                working_document = UploadedDocument.objects.select_related('owner').get(pk=document.pk)
                report = validate_document(working_document, progress_callback=publish)
                record_audit(
                    working_document.owner,
                    'document_auto_validated',
                    target=working_document.name,
                    metadata={'document_id': working_document.id, 'report_id': report.id, 'score': report.score, 'streaming': True},
                )
                events.put(
                    {
                        'type': 'complete',
                        'stage': 'complete',
                        'progress': 100,
                        'message': 'Streaming validation complete. Dashboard telemetry and AI recommendations are ready.',
                        'document': UploadedDocumentSerializer(working_document).data,
                        'validation_report': ValidationReportSerializer(report).data,
                    }
                )
            except Exception as exc:
                logger.exception('Streaming upload validation failed for document %s', document.pk)
                events.put(
                    {
                        'type': 'error',
                        'stage': 'failed',
                        'progress': 100,
                        'message': 'Automatic validation failed during the streaming workflow.',
                        'detail': str(exc),
                    }
                )
            finally:
                close_old_connections()
                events.put({'type': 'done'})

        threading.Thread(target=worker, daemon=True).start()

        def stream():
            yield encode_stream_event(
                {
                    'type': 'stage',
                    'stage': 'upload',
                    'progress': 12,
                    'message': 'File uploaded. AI cockpit power-on sequence started.',
                    'document': document_payload,
                }
            )
            while True:
                payload = events.get()
                if payload.get('type') == 'done':
                    break
                yield encode_stream_event(payload)

        response = StreamingHttpResponse(stream(), content_type='application/x-ndjson')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
