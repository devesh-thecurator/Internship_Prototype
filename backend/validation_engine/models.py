from django.db import models

from uploads.models import UploadedDocument


class ValidationReport(models.Model):
    document = models.OneToOneField(UploadedDocument, on_delete=models.CASCADE, related_name='validation_report')
    created_at = models.DateTimeField(auto_now_add=True)
    summary = models.TextField(blank=True)
    issues = models.JSONField(default=list, blank=True)
    score = models.FloatField(default=0.0)
    clause_matches = models.JSONField(default=list, blank=True)
    completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Validation report for {self.document.name}"


class ComplianceResult(models.Model):
    document = models.OneToOneField(UploadedDocument, on_delete=models.CASCADE, related_name='compliance_result')
    match_percentage = models.FloatField(default=0.0)
    compliance_score = models.FloatField(default=0.0)
    mismatches = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Compliance result for {self.document.name}"


class RiskAssessment(models.Model):
    document = models.ForeignKey(UploadedDocument, on_delete=models.CASCADE, related_name='risk_assessments')
    risk_score = models.FloatField(default=0.0)
    risk_level = models.CharField(max_length=50, default='moderate')
    anomalies = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Risk assessment for {self.document.name}"
