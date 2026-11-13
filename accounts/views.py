from django.contrib import messages
from django.contrib.auth.views import LoginView
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import CreateView, ListView

from .forms import CompanyForm, StudentForm
from .models import Company, User
from .permissions import AdminRequiredMixin


class HomeView(View):
    """Send each user to the landing page for their role."""

    def get(self, request):
        if not request.user.is_authenticated:
            return redirect('login')
        return redirect({
            'admin': 'exam_list',
            'company': 'company_home',
            'student': 'student_dashboard',
        }[request.user.role])


class RoleLoginView(LoginView):
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True


class CompanyListView(AdminRequiredMixin, ListView):
    model = Company
    template_name = 'accounts/company_list.html'
    queryset = Company.objects.select_related('user')


class CompanyCreateView(AdminRequiredMixin, CreateView):
    form_class = CompanyForm
    template_name = 'form.html'
    success_url = reverse_lazy('company_list')
    extra_context = {'title': 'Add company'}

    def form_valid(self, form):
        messages.success(self.request, 'Company login created.')
        return super().form_valid(form)


class StudentListView(AdminRequiredMixin, ListView):
    template_name = 'accounts/student_list.html'
    paginate_by = 50

    def get_queryset(self):
        return User.objects.filter(role=User.Role.STUDENT).order_by('roll_number', 'username')


class StudentCreateView(AdminRequiredMixin, CreateView):
    form_class = StudentForm
    template_name = 'form.html'
    success_url = reverse_lazy('student_list')
    extra_context = {'title': 'Add student'}

    def form_valid(self, form):
        messages.success(self.request, 'Student created.')
        return super().form_valid(form)
