# PlacementPro

Online aptitude exam portal for campus placement drives. A **company** sets up and runs the test; many **students** sit it.

- **Backend:** Django (JSON API under `/api/`), SQLite locally / PostgreSQL in production
- **Frontend:** React (Vite) + Tailwind CSS, in `frontend/`

## Roles

| Role | Can do |
|------|--------|
| **Company** | Logs in with an account created for it, builds its own question bank (manual or CSV import), creates exams, sees ranked section-wise results of its own exams and exports them to CSV. Cannot see other companies' data |
| **Student** | Registers with email + password, then logs in. After login: exam instructions, then the exam (questions numbered 1, 2, 3...), then the result page |

Company accounts are not self-service. Create one with:

```bash
python manage.py create_company <username> <email> <password> --name "Company Name"
```

Companies sign in on the same login page with their email.

## Setup (once)

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env            # optional; defaults to SQLite
python manage.py migrate
python manage.py seed             # optional demo data

cd frontend
npm install
```

## Run (development): two terminals

**Terminal 1 - backend (Django, port 8000)**
```bash
.venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 - frontend (React, port 5180)**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5180/** (the React dev server forwards `/api` to Django).

**Demo logins (from `seed`)**

- Company: `acme@example.com` / `company123`
- Students: `student1@example.com` ... `student5@example.com` / `student123`

`seed` creates 1 company, 5 students, 40 questions (10 per section, owned by the company) and a "Sample Aptitude Test" open for a week. Safe to re-run. Change the passwords before any real use.

## Run (single server, production-style)

```bash
cd frontend && npm run build && cd ..
python manage.py runserver
```
Django then serves the built React app and the API together at http://127.0.0.1:8000/.

## Typical flow

1. Company signs in, adds questions (or imports a CSV), then creates an exam: duration, negative marking, start/end window, and how many random questions per section. Keep **Published** ticked so students can see it.
2. A student logs in, reads the instructions, starts the exam and answers using the numbered palette.
3. Company opens **Results** for the ranking and exports CSV.

## API overview

`/api/auth/{me,login,logout,register}/`, `/api/student/{home,exams/<id>,exams/<id>/start}/`,
`/api/attempts/<id>/{,answer,violation,submit,result}/`, `/api/company/{exams,questions}/...`.
Authentication is Django's session cookie plus a CSRF token (sent as `X-CSRFToken`).

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
- **No answer leakage:** the exam API only sends question text and shuffled option text; correct answers never leave the server. Options are sent by position and mapped back server-side.
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

- Set `DEBUG=0`, a real `SECRET_KEY` and `ALLOWED_HOSTS`, and use a proper WSGI server (e.g. gunicorn) with a static-file server such as WhiteNoise or nginx for `frontend/dist`.
- Optional: `python manage.py createsuperuser` gives access to Django's built-in `/django-admin/`.
