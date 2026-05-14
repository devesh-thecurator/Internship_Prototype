from rest_framework import serializers

from .models import ValidationReport
from uploads.serializers import UploadedDocumentSerializer


class ComplianceResultSerializer(serializers.Serializer):
    match_percentage = serializers.FloatField()
    compliance_score = serializers.FloatField()
    mismatches = serializers.ListField(child=serializers.CharField())
    recommendations = serializers.ListField(child=serializers.CharField())


class RiskAssessmentSerializer(serializers.Serializer):
    risk_score = serializers.FloatField()
    risk_level = serializers.CharField()
    anomalies = serializers.ListField(child=serializers.CharField())


class ValidationReportSerializer(serializers.ModelSerializer):
    document = UploadedDocumentSerializer(read_only=True)
    compliance_result = serializers.SerializerMethodField()
    risk_assessments = serializers.SerializerMethodField()

    class Meta:
        model = ValidationReport
        fields = [
            'id',
            'document',
            'created_at',
            'summary',
            'issues',
            'score',
            'clause_matches',
            'completed',
            'compliance_result',
            'risk_assessments',
        ]

    def get_compliance_result(self, obj):
        try:
            compliance = obj.document.compliance_result
        except Exception:
            compliance = None
        if not compliance:
            return None
        return {
            'match_percentage': compliance.match_percentage,
            'compliance_score': compliance.compliance_score,
            'mismatches': compliance.mismatches,
            'recommendations': compliance.recommendations,
        }

    def get_risk_assessments(self, obj):
        risks = obj.document.risk_assessments.order_by('-created_at')[:3]
        return [
            {
                'risk_score': risk.risk_score,
                'risk_level': risk.risk_level,
                'anomalies': risk.anomalies,
            }
            for risk in risks
        ]
