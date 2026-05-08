from rest_framework.permissions import BasePermission


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.role in ['admin', 'manager'] or user.is_superuser))


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.role == 'admin' or user.is_superuser))
