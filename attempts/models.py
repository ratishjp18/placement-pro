from django.conf import settings
from django.db import models
from django.utils import timezone

from exams.models import Exam
from questions.models import Question, Section


class Attempt(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = 'in_progress', 'In progress'
        SUBMITTED = 'submitted', 'Submitted'

    class Reason(models.TextChoices):
        MANUAL = 'manual', 'Submitted by student'
        TIMEOUT = 'timeout', 'Time ended'
        VIOLATIONS = 'violations', 'Too many violations'

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attempts')
    started_at = models.DateTimeField(default=timezone.now)
    deadline = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.IN_PROGRESS)
    submit_reason = models.CharField(max_length=12, choices=Reason.choices, blank=True)
    violation_count = models.PositiveIntegerField(default=0)
    # Per-student randomisation, stored so refreshes always show the same order.
    question_order = models.JSONField(default=list)      # [question_id, ...]
    option_orders = models.JSONField(default=dict)       # {"question_id": ["C", "A", "D", "B"]}
    score = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    rank = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['exam', 'student'], name='one_attempt_per_student')]

    @property
    def is_submitted(self):
        return self.status == self.Status.SUBMITTED

    def remaining_seconds(self):
        return max(0, int((self.deadline - timezone.now()).total_seconds()))


class Answer(models.Model):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.PROTECT, related_name='+')
    selected_option = models.CharField(max_length=1, blank=True)   # real letter A-D, blank = none
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('attempt', 'question')


class ViolationLog(models.Model):
    class Kind(models.TextChoices):
        TAB_SWITCH = 'tab_switch', 'Tab switch'
        FULLSCREEN_EXIT = 'fullscreen_exit', 'Fullscreen exit'
        NO_FACE = 'no_face', 'Face not visible'
        MULTIPLE_FACES = 'multiple_faces', 'More than one face'
        CAMERA_OFF = 'camera_off', 'Camera turned off'

    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name='violations')
    kind = models.CharField(max_length=20, choices=Kind.choices)
    created_at = models.DateTimeField(auto_now_add=True)


class SectionScore(models.Model):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name='section_scores')
    section = models.CharField(max_length=10, choices=Section.choices)
    score = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    correct = models.PositiveIntegerField(default=0)
    wrong = models.PositiveIntegerField(default=0)
    unanswered = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('attempt', 'section')
