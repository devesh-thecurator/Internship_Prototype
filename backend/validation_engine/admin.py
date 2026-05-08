from django.contrib import admin

from .models import ComplianceResult, RiskAssessment, ValidationReport


@admin.register(ValidationReport)
class ValidationReportAdmin(admin.ModelAdmin):
    list_display = ['document', 'score', 'completed', 'created_at']
    list_filter = ['completed', 'created_at']


@admin.register(ComplianceResult)
class ComplianceResultAdmin(admin.ModelAdmin):
    list_display = ['document', 'match_percentage', 'compliance_score', 'created_at']
    list_filter = ['created_at']


@admin.register(RiskAssessment)
class RiskAssessmentAdmin(admin.ModelAdmin):
    list_display = ['document', 'risk_score', 'risk_level', 'created_at']
    list_filter = ['risk_level', 'created_at']
