from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from validation_engine.models import ValidationReport
from audit_logs.services import record_audit
from .models import ExportActivity
from .serializers import ExportActivitySerializer


class ReportExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        export_type = request.query_params.get('type', 'json')
        reports = ValidationReport.objects.filter(document__owner=request.user).select_related('document')
        payload = [
            {
                'id': report.id,
                'document_name': report.document.name,
                'score': report.score,
                'summary': report.summary,
                'issues': report.issues,
                'clauses': report.clause_matches,
                'created_at': report.created_at,
            }
            for report in reports
        ]

        ExportActivity.objects.create(
            user=request.user,
            report_id=None,
            export_type=export_type,
            metadata={'record_count': len(payload)},
        )
        record_audit(
            request.user,
            'reports_exported',
            target=export_type,
            metadata={'record_count': len(payload)},
        )

        return Response({'format': export_type, 'data': payload})


class ExportActivityListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        activities = ExportActivity.objects.filter(user=request.user).order_by('-created_at')
        serializer = ExportActivitySerializer(activities, many=True)
        return Response(serializer.data)
