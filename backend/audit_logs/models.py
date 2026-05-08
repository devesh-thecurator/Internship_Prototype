from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=200)
    target = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.user} {self.action} at {self.created_at}"