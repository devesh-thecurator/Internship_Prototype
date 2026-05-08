from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_ADMIN = 'admin'
    ROLE_MANAGER = 'manager'
    ROLE_REVIEWER = 'reviewer'
    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_MANAGER, 'Manager'),
        (ROLE_REVIEWER, 'Reviewer'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_REVIEWER)

    def is_admin(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser

    def __str__(self):
        return self.username
