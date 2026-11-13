from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from django.shortcuts import redirect
from django.views import View
from django.views.generic import CreateView

from .forms import CompanySignupForm, StudentSignupForm


class HomeView(View):
    """Send each user to the landing page for their role."""

    def get(self, request):
        if not request.user.is_authenticated:
            return redirect('login')
        return redirect('exam_list' if request.user.is_company else 'student_dashboard')


class RoleLoginView(LoginView):
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True


class SignupView(CreateView):
    template_name = 'accounts/signup.html'
    role_label = ''

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('home')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['role_label'] = self.role_label
        return ctx

    def form_valid(self, form):
        user = form.save()
        login(self.request, user)
        return redirect('home')


class StudentSignupView(SignupView):
    form_class = StudentSignupForm
    role_label = 'Student'


class CompanySignupView(SignupView):
    form_class = CompanySignupForm
    role_label = 'Company'
