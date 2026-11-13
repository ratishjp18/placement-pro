import json

from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views import View

from accounts.permissions import StudentRequiredMixin
from exams.models import Exam

from . import services
from .models import Attempt


class StudentDashboardView(StudentRequiredMixin, View):
    def get(self, request):
        now = timezone.now()
        attempts = {a.exam_id: a for a in Attempt.objects.filter(student=request.user)}
        upcoming, active, completed = [], [], []
        for exam in Exam.objects.filter(is_published=True).select_related('company').order_by('start_time'):
            attempt = attempts.get(exam.id)
            if attempt:
                attempt = services.ensure_current(attempt)
            item = {'exam': exam, 'attempt': attempt}
            if attempt and attempt.is_submitted:
                completed.append(item)
            elif now < exam.start_time:
                upcoming.append(item)
            elif now < exam.end_time:
                active.append(item)
            else:
                completed.append(item)  # missed
        return render(request, 'attempts/dashboard.html',
                      {'upcoming': upcoming, 'active': active, 'completed': completed})


class ExamIntroView(StudentRequiredMixin, View):
    """Instructions page; POST starts (or resumes) the attempt."""

    def get(self, request, pk):
        exam = get_object_or_404(Exam, pk=pk, is_published=True)
        attempt = services.get_attempt(exam, request.user)
        if attempt:
            attempt = services.ensure_current(attempt)
            if attempt.is_submitted:
                return redirect('attempt_result', pk=attempt.pk)
        return render(request, 'attempts/intro.html', {
            'exam': exam, 'attempt': attempt, 'sections': exam.sections.filter(num_questions__gt=0),
            'total_marks': exam.total_marks,
            'max_violations': services.settings.MAX_VIOLATIONS,
        })

    def post(self, request, pk):
        exam = get_object_or_404(Exam, pk=pk, is_published=True)
        try:
            attempt = services.start_attempt(exam, request.user)
        except services.ExamNotAvailable as e:
            messages.error(request, str(e))
            return redirect('student_dashboard')
        return redirect('attempt_take', pk=attempt.pk)


class OwnAttemptMixin(StudentRequiredMixin):
    def get_attempt(self, request, pk):
        return get_object_or_404(Attempt.objects.select_related('exam'), pk=pk, student=request.user)


class AttemptTakeView(OwnAttemptMixin, View):
    def get(self, request, pk):
        attempt = services.ensure_current(self.get_attempt(request, pk))
        if attempt.is_submitted:
            return redirect('attempt_result', pk=attempt.pk)
        return render(request, 'attempts/take.html', {
            'attempt': attempt, 'payload': services.build_payload(attempt)})


class JsonApiView(OwnAttemptMixin, View):
    def parse(self, request):
        try:
            return json.loads(request.body or b'{}')
        except ValueError:
            return None


class AnswerView(JsonApiView):
    def post(self, request, pk):
        attempt = self.get_attempt(request, pk)
        data = self.parse(request)
        if data is None:
            return JsonResponse({'error': 'bad request'}, status=400)
        try:
            ok = services.save_answer(attempt, int(data['question']), data.get('option'), data.get('marked', False))
        except (KeyError, TypeError, ValueError):
            return JsonResponse({'error': 'bad request'}, status=400)
        attempt.refresh_from_db()
        return JsonResponse({'ok': ok, 'finished': attempt.is_submitted,
                             'remaining': attempt.remaining_seconds()})


class ViolationView(JsonApiView):
    def post(self, request, pk):
        attempt = self.get_attempt(request, pk)
        data = self.parse(request) or {}
        try:
            attempt = services.record_violation(attempt, data.get('type'))
        except ValueError:
            return JsonResponse({'error': 'bad request'}, status=400)
        return JsonResponse({'violations': attempt.violation_count, 'finished': attempt.is_submitted,
                             'remaining': attempt.remaining_seconds()})


class SubmitView(JsonApiView):
    def post(self, request, pk):
        attempt = services.finalize(self.get_attempt(request, pk), Attempt.Reason.MANUAL)
        return JsonResponse({'finished': True, 'url': redirect_url(attempt)})


def redirect_url(attempt):
    from django.urls import reverse
    return reverse('attempt_result', args=[attempt.pk])


class ResultView(OwnAttemptMixin, View):
    def get(self, request, pk):
        attempt = services.ensure_current(self.get_attempt(request, pk))
        if not attempt.is_submitted:
            return redirect('attempt_take', pk=attempt.pk)
        exam = attempt.exam
        return render(request, 'attempts/result.html', {
            'attempt': attempt, 'exam': exam,
            'section_scores': attempt.section_scores.all(),
            'total_marks': exam.total_marks,
            'participants': exam.attempts.filter(status='submitted').count(),
            'exam_open': exam.end_time > timezone.now(),
        })
