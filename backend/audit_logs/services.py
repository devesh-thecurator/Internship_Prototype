from .models import AuditLog


def record_audit(user, action, target='', metadata=None):
    AuditLog.objects.create(
        user=user,
        action=action,
        target=target,
        metadata=metadata or {},
    )
