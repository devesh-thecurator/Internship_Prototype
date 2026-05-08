from django.conf import settings
from django.db import models


class ChatHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_history')
    query = models.TextField()
    response = models.TextField()
    context = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat for {self.user.username} at {self.created_at:%Y-%m-%d %H:%M}"