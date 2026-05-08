from django.db.models import Avg, Count, Max
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from uploads.models import UploadedDocument
from validation_engine.models import ValidationReport, RiskAssessment


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        total_documents = UploadedDocument.objects.filter(owner=request.user).count()
        total_reports = ValidationReport.objects.filter(document__owner=request.user).count()
        avg_score = ValidationReport.objects.filter(document__owner=request.user).aggregate(avg_score=Avg('score'))['avg_score'] or 0.0
        high_risk = RiskAssessment.objects.filter(document__owner=request.user).order_by('-risk_score').first()
        recent_reports = ValidationReport.objects.filter(document__owner=request.user).order_by('-created_at')[:5]

        return Response(
            {
                'total_documents': total_documents,
                'total_reports': total_reports,
                'average_compliance_score': round(avg_score, 1),
                'highest_risk_score': high_risk.risk_score if high_risk else 0.0,
                'recent_reports': [
                    {
                        'id': report.id,
                        'document_name': report.document.name,
                        'score': report.score,
                        'completed': report.completed,
                        'created_at': report.created_at,
                    }
                    for report in recent_reports
                ],
            }
        )
