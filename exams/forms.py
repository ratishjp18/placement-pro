import random

from django import forms
from django.db import transaction

from questions.models import Question, Section

from .models import Exam, ExamQuestion, ExamSection


class ExamForm(forms.ModelForm):
    """Exam details plus how many random questions to draw from each section."""

    class Meta:
        model = Exam
        fields = ['title', 'company', 'duration_minutes', 'negative_marking',
                  'start_time', 'end_time', 'is_published']
        widgets = {
            'start_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}, format='%Y-%m-%dT%H:%M'),
            'end_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}, format='%Y-%m-%dT%H:%M'),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for f in ('start_time', 'end_time'):
            self.fields[f].input_formats = ['%Y-%m-%dT%H:%M', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M']
        existing = {}
        if self.instance.pk:
            existing = {s.section: s.num_questions for s in self.instance.sections.all()}
        for value, label in Section.choices:
            self.fields[f'count_{value}'] = forms.IntegerField(
                label=f'{label} questions', min_value=0, initial=existing.get(value, 0))

    def clean(self):
        data = super().clean()
        start, end = data.get('start_time'), data.get('end_time')
        if start and end and end <= start:
            self.add_error('end_time', 'End time must be after start time.')
        counts = {v: data.get(f'count_{v}') or 0 for v, _ in Section.choices}
        if self.errors:
            return data
        if sum(counts.values()) == 0:
            raise forms.ValidationError('Choose at least one question.')
        for value, label in Section.choices:
            available = Question.objects.filter(section=value, is_active=True).count()
            if counts[value] > available:
                self.add_error(f'count_{value}',
                               f'Only {available} active {label} questions in the bank.')
        if self.instance.pk and self.instance.attempts.exists():
            current = {s.section: s.num_questions for s in self.instance.sections.all()}
            if any(counts[v] != current.get(v, 0) for v in counts):
                raise forms.ValidationError(
                    'Students have already started this exam; the question set can no longer change.')
        self.counts = counts
        return data

    @transaction.atomic
    def save(self, commit=True):
        exam = super().save(commit=False)
        if not exam.pk:
            exam.created_by = getattr(self, 'user', None)
        exam.save()
        for value, n in self.counts.items():
            ExamSection.objects.update_or_create(
                exam=exam, section=value, defaults={'num_questions': n})
            current = ExamQuestion.objects.filter(exam=exam, question__section=value)
            if current.count() == n:
                continue
            current.delete()
            ids = list(Question.objects.filter(section=value, is_active=True).values_list('id', flat=True))
            ExamQuestion.objects.bulk_create(
                ExamQuestion(exam=exam, question_id=qid) for qid in random.sample(ids, n))
        for order, eq in enumerate(exam.exam_questions.order_by('question__section', 'id')):
            if eq.order != order:
                eq.order = order
                eq.save(update_fields=['order'])
        return exam
