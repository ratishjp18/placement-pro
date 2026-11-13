import csv

from django.http import HttpResponse

from questions.models import Section

SECTION_LABELS = dict(Section.choices)


def build_results(exam):
    """Return (sections, rows) for submitted attempts, best rank first."""
    attempts = (exam.attempts.filter(status='submitted')
                .select_related('student').prefetch_related('section_scores')
                .order_by('rank', 'submitted_at'))
    sections = [s.section for s in exam.sections.all() if s.num_questions]
    rows = []
    for a in attempts:
        by_section = {s.section: s for s in a.section_scores.all()}
        rows.append({
            'attempt': a,
            'student': a.student,
            'sections': [by_section.get(s) for s in sections],
        })
    return [(s, SECTION_LABELS[s]) for s in sections], rows


def results_csv_response(exam):
    sections, rows = build_results(exam)
    resp = HttpResponse(content_type='text/csv')
    resp['Content-Disposition'] = f'attachment; filename="exam_{exam.pk}_results.csv"'
    writer = csv.writer(resp)
    writer.writerow(['Rank', 'Roll number', 'Name', 'Email'] +
                    [f'{label} score' for _, label in sections] +
                    ['Total score', 'Violations', 'Submitted at', 'Submit reason'])
    for r in rows:
        a, st = r['attempt'], r['student']
        writer.writerow(
            [a.rank, st.roll_number or '', st.display_name, st.email] +
            [s.score if s else 0 for s in r['sections']] +
            [a.score, a.violation_count, a.submitted_at.strftime('%Y-%m-%d %H:%M:%S'), a.submit_reason])
    return resp
