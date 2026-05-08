from django.contrib import admin

from .models import UploadedDocument


@admin.register(UploadedDocument)
class UploadedDocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'uploaded_at', 'processed']
    list_filter = ['processed', 'uploaded_at']
