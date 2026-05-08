from django.contrib import admin

from .models import ExportActivity


@admin.register(ExportActivity)
class ExportActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'export_type', 'created_at']
    list_filter = ['export_type', 'created_at']
