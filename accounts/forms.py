from django import forms
from django.db import transaction

from .models import Company, User


class StudentForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'roll_number']

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = User.Role.STUDENT
        user.set_password(self.cleaned_data['password'])
        user.save()
        return user


class CompanyForm(forms.ModelForm):
    username = forms.CharField(max_length=150)
    password = forms.CharField(widget=forms.PasswordInput, min_length=6)

    class Meta:
        model = Company
        fields = ['name', 'contact_person', 'phone', 'website']

    def clean_username(self):
        username = self.cleaned_data['username']
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError('That username is already taken.')
        return username

    @transaction.atomic
    def save(self, commit=True):
        user = User.objects.create_user(
            username=self.cleaned_data['username'],
            password=self.cleaned_data['password'],
            role=User.Role.COMPANY,
            first_name=self.cleaned_data['name'][:150],
        )
        company = super().save(commit=False)
        company.user = user
        company.save()
        return company
