# PlacementPro

Online aptitude exam portal for campus placement drives. A **company** sets up and runs the test; many **students** sit it. Built with Django, Tailwind (CDN) and vanilla JS.

## Roles

| Role | Can do |
|------|--------|
| **Company** | Registers itself, builds its own question bank (manual or CSV import), creates exams, sees ranked section-wise results of its own exams and exports them to CSV. Cannot see other companies' data |
| **Student** | Registers, sees upcoming / active / completed exams, takes them, sees score, section breakdown and rank |

There is no placement-officer role. Both roles sign up themselves from the login page.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env            # optional; defaults to SQLite
python manage.py migrate
python manage.py seed             # optional demo data
python manage.py runserver
```

Open http://127.0.0.1:8000/

**Demo logins (from `seed`)**

- Company: `acme` / `company123`
- Students: `student1` ... `student5` / `student123`

`seed` creates 1 company, 5 students, 40 questions (10 per section, owned by the company) and a "Sample Aptitude Test" open for a week. Safe to re-run. Change the passwords before any real use.

## Typical flow

1. Company signs in, adds questions (or imports a CSV), then creates an exam: duration, negative marking, start/end window, and how many random questions per section. Tick **Is published** so students can see it.
2. Students sign in, open the exam while the window is active, and take it.
3. Company opens **Results** for the ranking and exports CSV.

## PostgreSQL

Set `DATABASE_URL=postgres://user:password@host:5432/dbname` in `.env`. Without it, SQLite is used.

## CSV question import

Columns: `section, topic, difficulty, marks, text, option_a, option_b, option_c, option_d, correct_option`
(sections: quant / logical / verbal / technical; difficulty: easy / medium / hard; correct_option: A-D).
A sample file can be downloaded from the import page. A bad row cancels the whole import and lists the errors.

## How exam integrity works

- **Server-side timer:** each attempt has a `deadline` set when it starts (`min(start + duration, exam end)`). The browser clock is display-only and re-syncs on every save. Answers after the deadline are rejected and the attempt is auto-submitted.
- **Auto-submit on time out:** the browser submits at zero; the server also finalizes any expired attempt the next time it is touched. For attempts whose browser was closed, schedule `python manage.py finalize_expired` every minute (cron / Windows Task Scheduler).
- **Randomisation:** question order (within each section) and option order are shuffled per student and stored, so a refresh shows the same layout.
- **No answer leakage:** the exam page only receives question text and shuffled option text; correct answers never leave the server. Options are sent by position and mapped back server-side.
- **Violations:** tab switches and fullscreen exits are posted to the server, logged, and counted. The 3rd one auto-submits (`MAX_VIOLATIONS` in settings).
- **One attempt per student:** enforced by a unique DB constraint. Refresh restores answers, marks and remaining time.

Limits: browser-based proctoring can deter, not prevent, cheating (e.g. a second device).

## Scoring and rank

Correct = + question marks; wrong = - marks x negative-marking fraction (e.g. 0.25); unanswered = 0.
Rank is by total score, ties broken by earlier submission time.

## Tests

```bash
python manage.py test
```

## Production notes

- Tailwind is loaded from the CDN for simplicity. For production, build CSS with the Tailwind CLI and serve it as a static file.
- Set `DEBUG=0`, a real `SECRET_KEY` and `ALLOWED_HOSTS`; run `collectstatic` and use a proper WSGI server.
- Optional: `python manage.py createsuperuser` gives access to Django's built-in `/django-admin/` for emergencies.
