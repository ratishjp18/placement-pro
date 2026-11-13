from decimal import Decimal

from django.db import models
from django.utils import timezone

from questions.models import Question, Section


class Exam(models.Model):
    title = models.CharField(max_length=200)
    company = models.ForeignKey('accounts.Company', on_delete=models.CASCADE, related_name='exams')
    duration_minutes = models.PositiveIntegerField(default=60)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return self.title

    @property
    def status(self):
        now = timezone.now()
        if not self.is_published:
            return 'draft'
        if now < self.start_time:
            return 'upcoming'
        if now < self.end_time:
            return 'active'
        return 'ended'

    @property
    def total_marks(self):
        return sum((eq.question.marks for eq in self.exam_questions.select_related('question')), Decimal(0))

    @property
    def question_count(self):
        return self.exam_questions.count()


class ExamSection(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='sections')
    section = models.CharField(max_length=10, choices=Section.choices)
    num_questions = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('exam', 'section')


class ExamQuestion(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='exam_questions')
    question = models.ForeignKey(Question, on_delete=models.PROTECT, related_name='exam_links')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = ('exam', 'question')
