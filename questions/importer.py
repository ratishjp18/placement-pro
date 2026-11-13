import csv
import io
from decimal import Decimal, InvalidOperation

from django.db import transaction

from .models import Question, Section

COLUMNS = ['section', 'topic', 'difficulty', 'marks', 'text',
           'option_a', 'option_b', 'option_c', 'option_d', 'correct_option']

SAMPLE_CSV = (
    ','.join(COLUMNS) + '\n'
    'quant,Percentages,easy,1,"What is 20% of 150?",20,25,30,35,C\n'
    'verbal,Synonyms,medium,1,"Choose the synonym of ""rapid""",Slow,Quick,Late,Calm,B\n'
)

SECTION_ALIASES = {
    **{s.value: s.value for s in Section},
    **{s.label.lower(): s.value for s in Section},
    'quantitative': 'quant', 'logical reasoning': 'logical',
}


def import_questions(uploaded_file, company):
    """Import questions from a CSV. All-or-nothing: returns (created_count, errors)."""
    try:
        text = uploaded_file.read().decode('utf-8-sig')
    except UnicodeDecodeError:
        return 0, ['File must be UTF-8 encoded CSV.']

    reader = csv.DictReader(io.StringIO(text))
    headers = [h.strip().lower() for h in (reader.fieldnames or [])]
    missing = [c for c in COLUMNS if c != 'topic' and c not in headers]
    if missing:
        return 0, [f'Missing column(s): {", ".join(missing)}']

    questions, errors = [], []
    for line_no, raw in enumerate(reader, start=2):
        row = {(k or '').strip().lower(): (v or '').strip() for k, v in raw.items()}
        if not any(row.values()):
            continue
        section = SECTION_ALIASES.get(row['section'].lower())
        difficulty = row['difficulty'].lower() or 'medium'
        correct = row['correct_option'].upper()
        problems = []
        if not section:
            problems.append(f'unknown section "{row["section"]}"')
        if difficulty not in Question.Difficulty.values:
            problems.append(f'unknown difficulty "{row["difficulty"]}"')
        if correct not in ('A', 'B', 'C', 'D'):
            problems.append('correct_option must be A, B, C or D')
        try:
            marks = Decimal(row['marks'] or '1')
            if marks <= 0:
                raise InvalidOperation
        except InvalidOperation:
            problems.append('marks must be a positive number')
            marks = Decimal(1)
        for key in ('text', 'option_a', 'option_b', 'option_c', 'option_d'):
            if not row[key]:
                problems.append(f'{key} is empty')
        if problems:
            errors.append(f'Line {line_no}: ' + '; '.join(problems))
            continue
        questions.append(Question(
            section=section, topic=row.get('topic', ''), difficulty=difficulty, marks=marks,
            text=row['text'], option_a=row['option_a'], option_b=row['option_b'],
            option_c=row['option_c'], option_d=row['option_d'],
            correct_option=correct, company=company,
        ))

    if errors:
        return 0, errors
    if not questions:
        return 0, ['No question rows found.']
    with transaction.atomic():
        Question.objects.bulk_create(questions)
    return len(questions), []
