from django.conf import settings
from django.db import models


class ExportActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='export_activities')
    report_id = models.IntegerField(null=True, blank=True)
    export_type = models.CharField(max_length=50, default='json')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Export by {self.user.username} at {self.created_at:%Y-%m-%d %H:%M}"