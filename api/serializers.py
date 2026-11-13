from django.utils import timezone

from questions.models import Section


def user_dict(user):
    return {
        'id': user.id,
        'email': user.email,
        'role': user.role,
        'name': user.display_name,
        'company': user.company.name if user.is_company else None,
    }


def local_input(dt):
    """Format a datetime for <input type=datetime-local>."""
    return timezone.localtime(dt).strftime('%Y-%m-%dT%H:%M')


def exam_dict(exam, detail=False):
    data = {
        'id': exam.id,
        'title': exam.title,
        'company': exam.company.name,
        'duration_minutes': exam.duration_minutes,
        'negative_marking': str(exam.negative_marking),
        'start_time': exam.start_time.isoformat(),
        'end_time': exam.end_time.isoformat(),
        'is_published': exam.is_published,
        'status': exam.status,
        'question_count': exam.question_count,
    }
    if detail:
        counts = {s.section: s.num_questions for s in exam.sections.all()}
        data['start_input'] = local_input(exam.start_time)
        data['end_input'] = local_input(exam.end_time)
        data['counts'] = {value: counts.get(value, 0) for value, _ in Section.choices}
        data['locked'] = exam.attempts.exists()
    return data


def question_dict(q):
    return {
        'id': q.id, 'section': q.section, 'section_label': q.get_section_display(),
        'topic': q.topic, 'difficulty': q.difficulty, 'difficulty_label': q.get_difficulty_display(),
        'marks': str(q.marks), 'text': q.text,
        'option_a': q.option_a, 'option_b': q.option_b, 'option_c': q.option_c, 'option_d': q.option_d,
        'correct_option': q.correct_option, 'is_active': q.is_active,
    }
