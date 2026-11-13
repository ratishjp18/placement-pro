from django.contrib import messages
from django.db.models import ProtectedError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import CreateView, ListView, UpdateView

from accounts.permissions import CompanyRequiredMixin

from .forms import CSVImportForm, QuestionForm
from .importer import SAMPLE_CSV, import_questions
from .models import Question, Section


class QuestionListView(CompanyRequiredMixin, ListView):
    model = Question
    template_name = 'questions/list.html'
    paginate_by = 25

    def get_queryset(self):
        qs = Question.objects.filter(company=self.company)
        g = self.request.GET
        if g.get('section'):
            qs = qs.filter(section=g['section'])
        if g.get('difficulty'):
            qs = qs.filter(difficulty=g['difficulty'])
        if g.get('q'):
            qs = qs.filter(text__icontains=g['q'])
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['sections'] = Section.choices
        ctx['difficulties'] = Question.Difficulty.choices
        ctx['filters'] = self.request.GET
        params = self.request.GET.copy()
        params.pop('page', None)
        ctx['query_string'] = params.urlencode()
        return ctx


class QuestionCreateView(CompanyRequiredMixin, CreateView):
    form_class = QuestionForm
    template_name = 'form.html'
    success_url = reverse_lazy('question_list')
    extra_context = {'title': 'Add question'}

    def form_valid(self, form):
        form.instance.company = self.company
        return super().form_valid(form)


class QuestionUpdateView(CompanyRequiredMixin, UpdateView):
    def get_queryset(self):
        return Question.objects.filter(company=self.company)

    form_class = QuestionForm
    template_name = 'form.html'
    success_url = reverse_lazy('question_list')
    extra_context = {'title': 'Edit question'}


class QuestionDeleteView(CompanyRequiredMixin, View):
    def get(self, request, pk):
        return render(request, 'questions/confirm_delete.html',
                      {'question': get_object_or_404(Question, pk=pk, company=self.company)})

    def post(self, request, pk):
        question = get_object_or_404(Question, pk=pk, company=self.company)
        try:
            question.delete()
            messages.success(request, 'Question deleted.')
        except ProtectedError:
            question.is_active = False
            question.save(update_fields=['is_active'])
            messages.warning(request, 'Question is used in an exam, so it was deactivated instead of deleted.')
        return redirect('question_list')


class QuestionImportView(CompanyRequiredMixin, View):
    def get(self, request):
        return render(request, 'questions/import.html', {'form': CSVImportForm()})

    def post(self, request):
        form = CSVImportForm(request.POST, request.FILES)
        errors = []
        if form.is_valid():
            count, errors = import_questions(request.FILES['file'], self.company)
            if not errors:
                messages.success(request, f'Imported {count} questions.')
                return redirect('question_list')
        return render(request, 'questions/import.html', {'form': form, 'errors': errors[:50]})


class SampleCSVView(CompanyRequiredMixin, View):
    def get(self, request):
        resp = HttpResponse(SAMPLE_CSV, content_type='text/csv')
        resp['Content-Disposition'] = 'attachment; filename="questions_sample.csv"'
        return resp
