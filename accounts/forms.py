from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.db import transaction

from .models import Company, User


class StudentSignupForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'roll_number']

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = User.Role.STUDENT
        user.save()
        return user


class CompanySignupForm(UserCreationForm):
    name = forms.CharField(max_length=150, label='Company name')
    contact_person = forms.CharField(max_length=100, required=False)
    phone = forms.CharField(max_length=30, required=False)
    website = forms.URLField(required=False)

    class Meta:
        model = User
        fields = ['username', 'email']

    @transaction.atomic
    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = User.Role.COMPANY
        user.first_name = self.cleaned_data['name'][:150]
        user.save()
        Company.objects.create(
            user=user, name=self.cleaned_data['name'],
            contact_person=self.cleaned_data['contact_person'],
            phone=self.cleaned_data['phone'], website=self.cleaned_data['website'])
        return user
