from django.contrib import messages
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404, render
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import CreateView, ListView, UpdateView

from accounts.permissions import AdminOrCompanyMixin, AdminRequiredMixin, CompanyRequiredMixin

from .forms import ExamForm
from .models import Exam
from .results import build_results, results_csv_response


class ExamFormMixin:
    form_class = ExamForm
    template_name = 'form.html'
    success_url = reverse_lazy('exam_list')

    def get_form_kwargs(self):
        return super().get_form_kwargs()

    def form_valid(self, form):
        form.user = self.request.user
        messages.success(self.request, 'Exam saved.')
        return super().form_valid(form)


class ExamListView(AdminRequiredMixin, ListView):
    template_name = 'exams/list.html'
    queryset = Exam.objects.select_related('company')


class ExamCreateView(AdminRequiredMixin, ExamFormMixin, CreateView):
    model = Exam
    extra_context = {'title': 'Create exam'}


class ExamUpdateView(AdminRequiredMixin, ExamFormMixin, UpdateView):
    model = Exam
    extra_context = {'title': 'Edit exam'}


class CompanyHomeView(CompanyRequiredMixin, ListView):
    template_name = 'exams/company_home.html'

    def get_queryset(self):
        return Exam.objects.filter(company__user=self.request.user, is_published=True)


def _get_exam_for(user, pk):
    exam = get_object_or_404(Exam, pk=pk)
    if user.is_company and exam.company_id != getattr(getattr(user, 'company', None), 'id', None):
        raise PermissionDenied
    return exam


class ExamResultsView(AdminOrCompanyMixin, View):
    def get(self, request, pk):
        exam = _get_exam_for(request.user, pk)
        sections, rows = build_results(exam)
        return render(request, 'exams/results.html', {
            'exam': exam, 'sections': sections, 'rows': rows,
            'show_email': request.user.is_placement_admin,
        })


class ExamResultsCSVView(AdminOrCompanyMixin, View):
    def get(self, request, pk):
        return results_csv_response(_get_exam_for(request.user, pk))
