from django.conf import settings
from django.db import models


class UploadedDocument(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name
