from django.contrib import messages
from django.shortcuts import get_object_or_404, render
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import CreateView, ListView, UpdateView

from accounts.permissions import CompanyRequiredMixin

from .forms import ExamForm
from .models import Exam
from .results import build_results, results_csv_response


class ExamFormMixin(CompanyRequiredMixin):
    form_class = ExamForm
    template_name = 'form.html'
    success_url = reverse_lazy('exam_list')

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['company'] = self.company
        return kwargs

    def form_valid(self, form):
        messages.success(self.request, 'Exam saved.')
        return super().form_valid(form)


class ExamListView(CompanyRequiredMixin, ListView):
    template_name = 'exams/list.html'

    def get_queryset(self):
        return Exam.objects.filter(company=self.company)


class ExamCreateView(ExamFormMixin, CreateView):
    model = Exam
    extra_context = {'title': 'Create exam'}


class ExamUpdateView(ExamFormMixin, UpdateView):
    extra_context = {'title': 'Edit exam'}

    def get_queryset(self):
        return Exam.objects.filter(company=self.company)


class ExamResultsView(CompanyRequiredMixin, View):
    def get(self, request, pk):
        exam = get_object_or_404(Exam, pk=pk, company=self.company)
        sections, rows = build_results(exam)
        return render(request, 'exams/results.html', {'exam': exam, 'sections': sections, 'rows': rows})


class ExamResultsCSVView(CompanyRequiredMixin, View):
    def get(self, request, pk):
        return results_csv_response(get_object_or_404(Exam, pk=pk, company=self.company))
