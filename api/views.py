from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.db.models import ProtectedError
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie

from accounts.forms import StudentSignupForm
from attempts import services
from attempts.models import Attempt
from exams.forms import ExamForm
from exams.models import Exam
from exams.results import build_results, results_csv_response
from questions.forms import QuestionForm
from questions.importer import SAMPLE_CSV, import_questions
from questions.models import Question, Section

from .serializers import exam_dict, question_dict, user_dict
from .utils import bad_request, endpoint, invalid, read_json


# ---------------------------------------------------------------- auth

@ensure_csrf_cookie
@endpoint('GET', public=True)
def me(request):
    """Also sets the CSRF cookie the React app needs for POST requests."""
    if not request.user.is_authenticated:
        return JsonResponse({'user': None})
    return JsonResponse({'user': user_dict(request.user)})


@endpoint('POST', public=True)
def login_view(request):
    data = read_json(request)
    if data is None:
        return bad_request()
    user = authenticate(request, username=str(data.get('email', '')).strip(), password=data.get('password'))
    if user is None:
        return JsonResponse({'error': 'Invalid email or password.'}, status=400)
    login(request, user)
    return JsonResponse({'user': user_dict(user)})


@endpoint('POST')
def logout_view(request):
    logout(request)
    return JsonResponse({'ok': True})


@endpoint('POST', public=True)
def register(request):
    """Student self-registration. Does NOT log the user in."""
    data = read_json(request)
    if data is None:
        return bad_request()
    form = StudentSignupForm(data)
    if not form.is_valid():
        return invalid(form)
    form.save()
    return JsonResponse({'ok': True}, status=201)


# ---------------------------------------------------------------- student

def _exam_summary(exam):
    return {'id': exam.id, 'title': exam.title, 'company': exam.company.name,
            'start_time': exam.start_time.isoformat(), 'duration_minutes': exam.duration_minutes}


@endpoint('GET', role='student')
def student_home(request):
    """Where should this student go right after logging in?"""
    attempts = {a.exam_id: a for a in Attempt.objects.filter(student=request.user)}
    exams = list(Exam.objects.filter(is_published=True).select_related('company').order_by('start_time'))
    for exam in exams:  # an exam already in progress
        attempt = attempts.get(exam.id)
        if attempt and not services.ensure_current(attempt).is_submitted:
            return JsonResponse({'next': 'intro', 'exam_id': exam.id})
    for exam in exams:  # an open exam not yet started
        if exam.id not in attempts and exam.status == 'active':
            return JsonResponse({'next': 'intro', 'exam_id': exam.id})
    done = [a for a in attempts.values() if a.is_submitted]
    if done:
        latest = max(done, key=lambda a: a.submitted_at)
        return JsonResponse({'next': 'result', 'attempt_id': latest.id})
    return JsonResponse({'next': 'none',
                         'upcoming': [_exam_summary(e) for e in exams if e.status == 'upcoming']})


@endpoint('GET', role='student')
def student_intro(request, pk):
    exam = get_object_or_404(Exam.objects.select_related('company'), pk=pk, is_published=True)
    attempt = services.get_attempt(exam, request.user)
    if attempt:
        attempt = services.ensure_current(attempt)
    data = exam_dict(exam)
    data.update({
        'total_marks': str(exam.total_marks),
        'sections': [{'label': s.get_section_display(), 'count': s.num_questions}
                     for s in exam.sections.filter(num_questions__gt=0)],
        'max_violations': settings.MAX_VIOLATIONS,
        'attempt': {'id': attempt.id, 'submitted': attempt.is_submitted} if attempt else None,
    })
    return JsonResponse(data)


@endpoint('POST', role='student')
def student_start(request, pk):
    exam = get_object_or_404(Exam, pk=pk, is_published=True)
    try:
        attempt = services.start_attempt(exam, request.user)
    except services.ExamNotAvailable as e:
        return bad_request(str(e))
    return JsonResponse({'attempt_id': attempt.id})


def _own_attempt(request, pk):
    return get_object_or_404(Attempt.objects.select_related('exam'), pk=pk, student=request.user)


@endpoint('GET', role='student')
def attempt_detail(request, pk):
    attempt = services.ensure_current(_own_attempt(request, pk))
    if attempt.is_submitted:
        return JsonResponse({'finished': True})
    payload = services.build_payload(attempt)
    payload['title'] = attempt.exam.title
    return JsonResponse(payload)


@endpoint('POST', role='student')
def attempt_answer(request, pk):
    attempt = _own_attempt(request, pk)
    data = read_json(request)
    if data is None:
        return bad_request()
    try:
        ok = services.save_answer(attempt, int(data['question']), data.get('option'), data.get('marked', False))
    except (KeyError, TypeError, ValueError):
        return bad_request()
    attempt.refresh_from_db()
    return JsonResponse({'ok': ok, 'finished': attempt.is_submitted, 'remaining': attempt.remaining_seconds()})


@endpoint('POST', role='student')
def attempt_violation(request, pk):
    attempt = _own_attempt(request, pk)
    data = read_json(request) or {}
    try:
        attempt = services.record_violation(attempt, data.get('type'))
    except ValueError:
        return bad_request()
    return JsonResponse({'violations': attempt.violation_count, 'finished': attempt.is_submitted,
                         'remaining': attempt.remaining_seconds()})


@endpoint('POST', role='student')
def attempt_submit(request, pk):
    services.finalize(_own_attempt(request, pk), Attempt.Reason.MANUAL)
    return JsonResponse({'finished': True})


@endpoint('GET', role='student')
def attempt_result(request, pk):
    attempt = services.ensure_current(_own_attempt(request, pk))
    if not attempt.is_submitted:
        return JsonResponse({'finished': False})
    exam = attempt.exam
    return JsonResponse({
        'finished': True,
        'title': exam.title,
        'score': str(attempt.score),
        'total_marks': str(exam.total_marks),
        'rank': attempt.rank,
        'participants': exam.attempts.filter(status='submitted').count(),
        'violations': attempt.violation_count,
        'reason': attempt.get_submit_reason_display(),
        'exam_open': exam.end_time > timezone.now(),
        'sections': [{'label': s.get_section_display(), 'score': str(s.score), 'correct': s.correct,
                      'wrong': s.wrong, 'unanswered': s.unanswered} for s in attempt.section_scores.all()],
    })


# ---------------------------------------------------------------- company: exams

@endpoint('GET', 'POST', role='company')
def company_exams(request):
    company = request.user.company
    if request.method == 'POST':
        data = read_json(request)
        if data is None:
            return bad_request()
        form = ExamForm(data, company=company)
        if not form.is_valid():
            return invalid(form)
        return JsonResponse(exam_dict(form.save(), detail=True), status=201)
    exams = Exam.objects.filter(company=company).select_related('company')
    rows = []
    for e in exams:
        d = exam_dict(e)
        d['submissions'] = e.attempts.filter(status='submitted').count()
        rows.append(d)
    return JsonResponse({
        'company': company.name,
        'exams': rows,
        'question_total': company.questions.count(),
        'submission_total': Attempt.objects.filter(exam__company=company, status='submitted').count(),
    })


@endpoint('GET', 'PUT', role='company')
def company_exam(request, pk):
    company = request.user.company
    exam = get_object_or_404(Exam.objects.select_related('company'), pk=pk, company=company)
    if request.method == 'PUT':
        data = read_json(request)
        if data is None:
            return bad_request()
        form = ExamForm(data, instance=exam, company=company)
        if not form.is_valid():
            return invalid(form)
        exam = form.save()
    return JsonResponse(exam_dict(exam, detail=True))


@endpoint('GET', role='company')
def company_results(request, pk):
    exam = get_object_or_404(Exam, pk=pk, company=request.user.company)
    sections, rows = build_results(exam)
    return JsonResponse({
        'exam': {'id': exam.id, 'title': exam.title, 'status': exam.status,
                 'total_marks': str(exam.total_marks)},
        'sections': [{'value': v, 'label': l} for v, l in sections],
        'rows': [{
            'rank': r['attempt'].rank,
            'roll_number': r['student'].roll_number or '',
            'name': r['student'].display_name,
            'email': r['student'].email,
            'sections': [{'score': str(s.score), 'correct': s.correct, 'wrong': s.wrong} if s else None
                         for s in r['sections']],
            'score': str(r['attempt'].score),
            'violations': r['attempt'].violation_count,
            'reason': r['attempt'].get_submit_reason_display(),
        } for r in rows],
    })


@endpoint('GET', role='company')
def company_results_csv(request, pk):
    return results_csv_response(get_object_or_404(Exam, pk=pk, company=request.user.company))


# ---------------------------------------------------------------- company: questions

PAGE_SIZE = 25


@endpoint('GET', 'POST', role='company')
def company_questions(request):
    company = request.user.company
    if request.method == 'POST':
        data = read_json(request)
        if data is None:
            return bad_request()
        form = QuestionForm(data)
        if not form.is_valid():
            return invalid(form)
        q = form.save(commit=False)
        q.company = company
        q.save()
        return JsonResponse(question_dict(q), status=201)

    g = request.GET
    qs = Question.objects.filter(company=company)
    if g.get('section'):
        qs = qs.filter(section=g['section'])
    if g.get('difficulty'):
        qs = qs.filter(difficulty=g['difficulty'])
    if g.get('q'):
        qs = qs.filter(text__icontains=g['q'])
    count = qs.count()
    pages = max(1, -(-count // PAGE_SIZE))
    try:
        page = min(max(1, int(g.get('page', 1))), pages)
    except ValueError:
        page = 1
    items = qs[(page - 1) * PAGE_SIZE: page * PAGE_SIZE]
    return JsonResponse({
        'results': [question_dict(q) for q in items], 'count': count, 'page': page, 'pages': pages,
        'sections': [{'value': v, 'label': l} for v, l in Section.choices],
        'difficulties': [{'value': v, 'label': l} for v, l in Question.Difficulty.choices],
    })


@endpoint('GET', 'PUT', 'DELETE', role='company')
def company_question(request, pk):
    q = get_object_or_404(Question, pk=pk, company=request.user.company)
    if request.method == 'PUT':
        data = read_json(request)
        if data is None:
            return bad_request()
        form = QuestionForm(data, instance=q)
        if not form.is_valid():
            return invalid(form)
        q = form.save()
    elif request.method == 'DELETE':
        try:
            q.delete()
            return JsonResponse({'deleted': True})
        except ProtectedError:
            q.is_active = False
            q.save(update_fields=['is_active'])
            return JsonResponse({'deleted': False, 'deactivated': True,
                                 'message': 'Question is used in an exam, so it was deactivated instead of deleted.'})
    return JsonResponse(question_dict(q))


@endpoint('POST', role='company')
def company_import(request):
    upload = request.FILES.get('file')
    if not upload:
        return bad_request('Choose a CSV file.')
    count, errors = import_questions(upload, request.user.company)
    if errors:
        return JsonResponse({'imported': 0, 'errors': errors[:50]}, status=400)
    return JsonResponse({'imported': count})


@endpoint('GET', role='company')
def company_sample_csv(request):
    resp = HttpResponse(SAMPLE_CSV, content_type='text/csv')
    resp['Content-Disposition'] = 'attachment; filename="questions_sample.csv"'
    return resp
