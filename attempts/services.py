"""Exam-taking logic. Everything that matters (timer, scoring, violations) lives here, server-side."""
import random
from datetime import timedelta
from collections import defaultdict
from decimal import Decimal

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from exams.models import Exam
from questions.models import Question, Section

from .models import Answer, Attempt, SectionScore, ViolationLog

SECTION_ORDER = [s.value for s in Section]
MONEY = Decimal('0.01')


class ExamNotAvailable(Exception):
    pass


# ---------- starting ----------

def get_attempt(exam, student):
    return Attempt.objects.filter(exam=exam, student=student).first()


def start_attempt(exam, student):
    """Create the student's single attempt (or return the existing one)."""
    existing = get_attempt(exam, student)
    if existing:
        return existing
    now = timezone.now()
    if exam.status != 'active':
        raise ExamNotAvailable('This exam is not open right now.')

    # Randomise question order within each section (sections stay grouped) and option order per question.
    by_section = defaultdict(list)
    questions = {}
    for eq in exam.exam_questions.select_related('question'):
        by_section[eq.question.section].append(eq.question_id)
        questions[eq.question_id] = eq.question
    order = []
    for section in SECTION_ORDER:
        ids = by_section.get(section, [])
        random.shuffle(ids)
        order.extend(ids)
    option_orders = {}
    for qid in order:
        letters = ['A', 'B', 'C', 'D']
        random.shuffle(letters)
        option_orders[str(qid)] = letters

    deadline = min(now + timedelta(minutes=exam.duration_minutes), exam.end_time)
    try:
        with transaction.atomic():
            return Attempt.objects.create(
                exam=exam, student=student, started_at=now, deadline=deadline,
                question_order=order, option_orders=option_orders)
    except IntegrityError:  # double click / two tabs
        return get_attempt(exam, student)


# ---------- payload for the browser (never contains correct answers) ----------

def build_payload(attempt):
    qs = Question.objects.in_bulk(attempt.question_order)
    answers = {a.question_id: a for a in attempt.answers.all()}
    items = []
    for qid in attempt.question_order:
        q = qs[qid]
        letters = attempt.option_orders[str(qid)]
        ans = answers.get(qid)
        selected = None
        if ans and ans.selected_option:
            selected = letters.index(ans.selected_option)
        items.append({
            'id': qid,
            'section': q.section,
            'section_label': q.get_section_display(),
            'text': q.text,
            'marks': str(q.marks),
            'options': [q.option_text(l) for l in letters],
            'selected': selected,
        })
    return {
        'questions': items,
        'remaining': attempt.remaining_seconds(),
        'violations': attempt.violation_count,
        'max_violations': settings.MAX_VIOLATIONS,
    }


# ---------- saving answers ----------

def save_answer(attempt, question_id, position):
    """Store an answer. Returns False if the attempt is over (it is finalized first if time is up)."""
    attempt = ensure_current(attempt)
    if attempt.is_submitted:
        return False
    letters = attempt.option_orders.get(str(question_id))
    if letters is None:
        raise ValueError('Question not part of this attempt.')
    letter = ''
    if position is not None:
        if not isinstance(position, int) or not 0 <= position <= 3:
            raise ValueError('Bad option.')
        letter = letters[position]
    Answer.objects.update_or_create(
        attempt=attempt, question_id=question_id,
        defaults={'selected_option': letter})
    return True


# ---------- violations ----------

def record_violation(attempt, kind):
    if kind not in ViolationLog.Kind.values:
        raise ValueError('Bad violation type.')
    attempt = ensure_current(attempt)
    if attempt.is_submitted:
        return attempt
    ViolationLog.objects.create(attempt=attempt, kind=kind)
    Attempt.objects.filter(pk=attempt.pk).update(violation_count=F('violation_count') + 1)
    attempt.refresh_from_db()
    if attempt.violation_count >= settings.MAX_VIOLATIONS:
        return finalize(attempt, Attempt.Reason.VIOLATIONS)
    return attempt


# ---------- finishing ----------

def ensure_current(attempt):
    """Finalize the attempt if its server-side deadline has passed."""
    if not attempt.is_submitted and timezone.now() >= attempt.deadline:
        return finalize(attempt, Attempt.Reason.TIMEOUT)
    return attempt


def finalize(attempt, reason):
    """Score and close an attempt. Safe to call repeatedly."""
    with transaction.atomic():
        attempt = Attempt.objects.select_for_update().get(pk=attempt.pk)
        if attempt.is_submitted:
            return attempt
        exam = attempt.exam
        questions = Question.objects.in_bulk(attempt.question_order)
        answers = {a.question_id: a.selected_option for a in attempt.answers.all()}

        stats = {s: {'score': Decimal(0), 'correct': 0, 'wrong': 0, 'unanswered': 0} for s in SECTION_ORDER}
        for qid, q in questions.items():
            st = stats[q.section]
            chosen = answers.get(qid, '')
            if not chosen:
                st['unanswered'] += 1
            elif chosen == q.correct_option:
                st['correct'] += 1
                st['score'] += q.marks
            else:
                st['wrong'] += 1  # no negative marking

        SectionScore.objects.filter(attempt=attempt).delete()
        SectionScore.objects.bulk_create(
            SectionScore(attempt=attempt, section=s, score=v['score'].quantize(MONEY),
                         correct=v['correct'], wrong=v['wrong'], unanswered=v['unanswered'])
            for s, v in stats.items()
            if v['correct'] + v['wrong'] + v['unanswered'] > 0)

        attempt.score = sum((v['score'] for v in stats.values()), Decimal(0)).quantize(MONEY)
        attempt.status = Attempt.Status.SUBMITTED
        attempt.submit_reason = reason
        attempt.submitted_at = min(timezone.now(), attempt.deadline)
        attempt.save()
        recompute_ranks(exam)
        attempt.refresh_from_db()
        return attempt


def recompute_ranks(exam):
    """Rank = position by score (desc), ties broken by earlier submission."""
    ordered = exam.attempts.filter(status=Attempt.Status.SUBMITTED).order_by('-score', 'submitted_at', 'id')
    for position, a in enumerate(ordered, start=1):
        if a.rank != position:
            Attempt.objects.filter(pk=a.pk).update(rank=position)


def finalize_expired():
    """Close every in-progress attempt whose deadline has passed. Returns the number closed."""
    count = 0
    for a in Attempt.objects.filter(status=Attempt.Status.IN_PROGRESS, deadline__lte=timezone.now()):
        finalize(a, Attempt.Reason.TIMEOUT)
        count += 1
    return count
