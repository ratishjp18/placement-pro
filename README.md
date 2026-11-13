# PlacementPro

Online aptitude exam portal for campus placement drives. Built with Django, Tailwind (CDN) and vanilla JS.

## Roles

| Role | Can do |
|------|--------|
| **Placement officer (admin)** | Manage the question bank (CSV import), create exams, add companies and students, view ranked results and export CSV |
| **Company** | Sees only its own drives; views ranked, section-wise results and exports CSV. Cannot see questions or answers |
| **Student** | Dashboard (upcoming / active / completed), takes exams, sees score, section breakdown and rank |

Accounts are created by the placement officer (no self-registration).

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env            # optional; defaults to SQLite
python manage.py migrate
python manage.py seed             # demo data
python manage.py runserver
```

Open http://127.0.0.1:8000/

**Demo logins (from `seed`)**

- Admin: `admin` / `admin123`
- Company: `acme` / `company123`
- Students: `student1` … `student5` / `student123`

`seed` creates 1 admin, 1 company, 5 students, 40 questions (10 per section) and a "Sample Aptitude Test" that is open for a week. It is safe to re-run. Change the passwords before any real use.

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

Correct = + question marks; wrong = − marks × negative-marking fraction (e.g. 0.25); unanswered = 0.
Rank is by total score, ties broken by earlier submission time.

## Tests

```bash
python manage.py test
```

## Production notes

- Tailwind is loaded from the CDN for simplicity. For production, build CSS with the Tailwind CLI and serve it as a static file.
- Set `DEBUG=0`, a real `SECRET_KEY` and `ALLOWED_HOSTS`; run `collectstatic` and use a proper WSGI server.
