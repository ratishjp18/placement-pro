import json
from datetime import timedelta

from django.core.management import call_command
from django.test import Client, TestCase
from django.utils import timezone

from accounts.models import Company, User
from exams.models import Exam
from questions.models import Question

from .models import Attempt


class ApiTestCase(TestCase):
    def post(self, url, payload=None, client=None):
        return (client or self.client).post(url, json.dumps(payload or {}), content_type='application/json')

    def login(self, email, password, client=None):
        r = self.post('/api/auth/login/', {'email': email, 'password': password}, client=client)
        self.assertEqual(r.status_code, 200, r.content)


class ExamFlowTests(ApiTestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed', verbosity=0)
        cls.exam = Exam.objects.get(title='Sample Aptitude Test')
        cls.student = User.objects.get(email='student1@example.com')

    def setUp(self):
        self.login('student1@example.com', 'student123')

    def start(self):
        r = self.post(f'/api/student/exams/{self.exam.pk}/start/')
        self.assertEqual(r.status_code, 200)
        a = Attempt.objects.get(pk=r.json()['attempt_id'])
        self.post(f'/api/attempts/{a.pk}/begin/')  # camera on: the clock starts here
        a.refresh_from_db()
        return a

    def start_only(self):
        r = self.post(f'/api/student/exams/{self.exam.pk}/start/')
        return Attempt.objects.get(pk=r.json()['attempt_id'])

    def test_login_flow_goes_intro_exam_result(self):
        self.assertEqual(self.client.get('/api/student/home/').json(), {'next': 'intro', 'exam_id': self.exam.pk})
        a = self.start()
        self.assertEqual(self.client.get('/api/student/home/').json()['next'], 'intro')
        self.post(f'/api/attempts/{a.pk}/submit/')
        self.assertEqual(self.client.get('/api/student/home/').json(), {'next': 'result', 'attempt_id': a.pk})

    def test_one_attempt_and_refresh_restores(self):
        a = self.start()
        self.assertEqual(self.post(f'/api/student/exams/{self.exam.pk}/start/').json()['attempt_id'], a.pk)
        self.assertEqual(Attempt.objects.filter(student=self.student).count(), 1)
        self.post(f'/api/attempts/{a.pk}/answer/', {'question': a.question_order[0], 'option': 2})
        data = self.client.get(f'/api/attempts/{a.pk}/').json()
        self.assertEqual(data['questions'][0]['selected'], 2)
        self.assertGreater(data['remaining'], 0)

    def test_payload_never_contains_correct_answer(self):
        a = self.start()
        data = self.client.get(f'/api/attempts/{a.pk}/').json()
        allowed = {'id', 'section', 'section_label', 'text', 'marks', 'options', 'selected'}
        for q in data['questions']:
            self.assertEqual(set(q), allowed)   # no correct_option, no hints
        self.assertNotIn('correct_option', json.dumps(data))

    def test_scoring_has_no_negative_marking(self):
        a = self.start()
        qs = Question.objects.in_bulk(a.question_order)
        for qid, right in ((a.question_order[0], True), (a.question_order[1], False)):
            q = qs[qid]
            want = q.correct_option if right else next(l for l in 'ABCD' if l != q.correct_option)
            self.post(f'/api/attempts/{a.pk}/answer/',
                      {'question': qid, 'option': a.option_orders[str(qid)].index(want)})
        self.post(f'/api/attempts/{a.pk}/submit/')
        result = self.client.get(f'/api/attempts/{a.pk}/result/').json()
        self.assertEqual((result['attended'], result['total']), (2, 30))
        a.refresh_from_db()
        self.assertEqual(float(a.score), 1.0)   # 1 correct = +1; the wrong answer costs nothing
        # nothing that reveals right/wrong, rank, violations or sections
        self.assertEqual(set(result), {'finished', 'title', 'attended', 'total'})

    def test_server_rejects_answers_after_deadline(self):
        a = self.start()
        Attempt.objects.filter(pk=a.pk).update(deadline=timezone.now() - timedelta(seconds=1))
        r = self.post(f'/api/attempts/{a.pk}/answer/', {'question': a.question_order[0], 'option': 0})
        self.assertFalse(r.json()['ok'])
        a.refresh_from_db()
        self.assertEqual(a.submit_reason, 'timeout')

    def test_three_violations_auto_submit(self):
        a = self.start()
        for _ in range(3):
            r = self.post(f'/api/attempts/{a.pk}/violation/', {'type': 'tab_switch'})
        self.assertTrue(r.json()['finished'])
        a.refresh_from_db()
        self.assertEqual(a.submit_reason, 'violations')

    def test_camera_violations_are_logged_and_counted(self):
        a = self.start()
        for kind in ('no_face', 'multiple_faces'):
            r = self.post(f'/api/attempts/{a.pk}/violation/', {'type': kind})
            self.assertFalse(r.json()['finished'])
        r = self.post(f'/api/attempts/{a.pk}/violation/', {'type': 'camera_off'})
        self.assertTrue(r.json()['finished'])
        self.assertEqual(a.violations.count(), 3)

    def test_clock_and_questions_wait_for_begin(self):
        a = self.start_only()
        self.assertIsNone(a.deadline)
        d = self.client.get(f'/api/attempts/{a.pk}/').json()
        self.assertFalse(d['started'])
        self.assertEqual(d['questions'], [])
        self.assertEqual(d['remaining'], self.exam.duration_minutes * 60)
        # nothing counts before the camera step is done
        self.post(f'/api/attempts/{a.pk}/violation/', {'type': 'no_face'})
        a.refresh_from_db()
        self.assertEqual(a.violation_count, 0)
        r = self.post(f'/api/attempts/{a.pk}/begin/').json()
        self.assertTrue(r['started'])
        self.assertEqual(len(r['questions']), self.exam.exam_questions.count())
        a.refresh_from_db()
        first = a.deadline
        self.assertIsNotNone(first)
        self.post(f'/api/attempts/{a.pk}/begin/')  # calling again must not restart the clock
        a.refresh_from_db()
        self.assertEqual(a.deadline, first)

    def test_student_cannot_use_company_api(self):
        self.assertEqual(self.client.get('/api/company/exams/').status_code, 403)
        self.assertEqual(self.client.get('/api/company/questions/').status_code, 403)

    def test_student_cannot_open_someone_elses_attempt(self):
        a = self.start()
        other = Client()
        self.login('student2@example.com', 'student123', client=other)
        self.assertEqual(other.get(f'/api/attempts/{a.pk}/').status_code, 404)


class CompanyAndAuthTests(ApiTestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed', verbosity=0)
        cls.exam = Exam.objects.get(title='Sample Aptitude Test')

    def test_company_sees_only_its_own_data(self):
        self.login('acme@example.com', 'company123')
        self.assertEqual(self.client.get(f'/api/company/exams/{self.exam.pk}/results/').status_code, 200)
        self.assertEqual(self.client.get('/api/company/questions/').json()['count'], 40)
        self.client.post('/api/auth/logout/')

        other = User.objects.create_user('globex@example.com', 'globex@example.com', 'x12345678', role='company')
        Company.objects.create(user=other, name='Globex')
        self.login('globex@example.com', 'x12345678')
        self.assertEqual(self.client.get(f'/api/company/exams/{self.exam.pk}/results/').status_code, 404)
        self.assertEqual(self.client.get('/api/company/questions/').json()['count'], 0)
        self.assertEqual(self.client.get('/api/student/home/').status_code, 403)

    def test_company_can_create_exam_and_question(self):
        self.login('acme@example.com', 'company123')
        r = self.post('/api/company/questions/', {
            'section': 'quant', 'topic': 't', 'difficulty': 'easy', 'marks': 1, 'text': 'New?',
            'option_a': '1', 'option_b': '2', 'option_c': '3', 'option_d': '4', 'correct_option': 'A',
            'is_active': True})
        self.assertEqual(r.status_code, 201, r.content)
        r = self.post('/api/company/exams/', {
            'title': 'Round 2', 'duration_minutes': 20,
            'start_time': '2030-01-01T10:00', 'end_time': '2030-01-01T12:00', 'is_published': True,
            'count_quant': 2, 'count_logical': 0, 'count_verbal': 0, 'count_technical': 0})
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()['question_count'], 2)
        bad = self.post('/api/company/exams/', {'title': ''})
        self.assertEqual(bad.status_code, 400)
        self.assertIn('title', bad.json()['errors'])

    def test_register_does_not_log_in(self):
        r = self.post('/api/auth/register/', {'email': 'newbie@example.com', 'password': 'Str0ngPass!9'})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(self.client.get('/api/auth/me/').json()['user'], None)
        self.login('newbie@example.com', 'Str0ngPass!9')
        self.assertEqual(self.client.get('/api/auth/me/').json()['user']['role'], 'student')
        dup = self.post('/api/auth/register/', {'email': 'newbie@example.com', 'password': 'Str0ngPass!9'})
        self.assertEqual(dup.status_code, 400)

    def test_bad_login(self):
        r = self.post('/api/auth/login/', {'email': 'nobody@example.com', 'password': 'nope'})
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.client.get('/api/company/exams/').status_code, 401)
