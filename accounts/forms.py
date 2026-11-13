from django import forms
from django.contrib.auth.password_validation import validate_password

from .models import User


class StudentSignupForm(forms.ModelForm):
    email = forms.EmailField()
    password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['email']

    def clean_email(self):
        email = self.cleaned_data['email'].strip().lower()
        if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
            raise forms.ValidationError('An account with this email already exists.')
        return email

    def clean_password(self):
        password = self.cleaned_data['password']
        validate_password(password)
        return password

    def save(self, commit=True):
        user = User(username=self.cleaned_data['email'], email=self.cleaned_data['email'],
                    role=User.Role.STUDENT)
        user.set_password(self.cleaned_data['password'])
        user.save()
        return user
