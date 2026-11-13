from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        COMPANY = 'company', 'Company'
        STUDENT = 'student', 'Student'

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)
    roll_number = models.CharField(max_length=30, unique=True, null=True, blank=True)

    @property
    def is_company(self):
        return self.role == self.Role.COMPANY

    @property
    def is_student(self):
        return self.role == self.Role.STUDENT

    @property
    def display_name(self):
        return self.get_full_name() or self.username


class Company(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company')
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    website = models.URLField(blank=True)

    class Meta:
        verbose_name_plural = 'companies'
        ordering = ['name']

    def __str__(self):
        return self.name
