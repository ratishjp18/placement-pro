import json
from datetime import timedelta

from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from accounts.models import Company, User
from exams.models import Exam
from questions.models import Question

from .models import Attempt


def post_json(client, url, payload):
    return client.post(url, json.dumps(payload), content_type='application/json')


class ExamFlowTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed', verbosity=0)
        cls.exam = Exam.objects.get(title='Sample Aptitude Test')
        cls.student = User.objects.get(username='student1')

    def setUp(self):
        self.client.login(username='student1', password='student123')

    def start(self):
        self.client.post(reverse('exam_intro', args=[self.exam.pk]))
        return Attempt.objects.get(exam=self.exam, student=self.student)

    def test_one_attempt_and_refresh_restores(self):
        a = self.start()
        self.client.post(reverse('exam_intro', args=[self.exam.pk]))
        self.assertEqual(Attempt.objects.filter(student=self.student).count(), 1)
        post_json(self.client, reverse('attempt_answer', args=[a.pk]),
                  {'question': a.question_order[0], 'option': 2})
        page = self.client.get(reverse('attempt_take', args=[a.pk]))
        self.assertEqual(page.context['payload']['questions'][0]['selected'], 2)

    def test_page_never_contains_correct_answer(self):
        a = self.start()
        html = self.client.get(reverse('attempt_take', args=[a.pk])).content.decode()
        self.assertNotIn('correct_option', html)

    def test_scoring_with_negative_marking(self):
        a = self.start()
        qs = Question.objects.in_bulk(a.question_order)
        for qid, right in ((a.question_order[0], True), (a.question_order[1], False)):
            q = qs[qid]
            want = q.correct_option if right else next(l for l in 'ABCD' if l != q.correct_option)
            post_json(self.client, reverse('attempt_answer', args=[a.pk]),
                      {'question': qid, 'option': a.option_orders[str(qid)].index(want)})
        self.client.post(reverse('attempt_submit', args=[a.pk]))
        a.refresh_from_db()
        self.assertEqual(float(a.score), 1 - 0.25)
        self.assertEqual(a.rank, 1)

    def test_server_rejects_answers_after_deadline(self):
        a = self.start()
        Attempt.objects.filter(pk=a.pk).update(deadline=timezone.now() - timedelta(seconds=1))
        r = post_json(self.client, reverse('attempt_answer', args=[a.pk]),
                      {'question': a.question_order[0], 'option': 0})
        self.assertFalse(r.json()['ok'])
        a.refresh_from_db()
        self.assertEqual(a.submit_reason, 'timeout')

    def test_three_violations_auto_submit(self):
        a = self.start()
        for _ in range(3):
            post_json(self.client, reverse('attempt_violation', args=[a.pk]), {'type': 'tab_switch'})
        a.refresh_from_db()
        self.assertTrue(a.is_submitted)
        self.assertEqual(a.submit_reason, 'violations')

    def test_student_cannot_use_company_pages(self):
        self.assertEqual(self.client.get(reverse('exam_list')).status_code, 403)
        self.assertEqual(self.client.get(reverse('question_list')).status_code, 403)

    def test_company_sees_only_its_own_data(self):
        self.client.logout()
        self.client.login(username='acme', password='company123')
        self.assertEqual(self.client.get(reverse('exam_results', args=[self.exam.pk])).status_code, 200)
        other = User.objects.create_user('globex', password='x12345678', role='company')
        Company.objects.create(user=other, name='Globex')
        self.client.logout()
        self.client.login(username='globex', password='x12345678')
        self.assertEqual(self.client.get(reverse('exam_results', args=[self.exam.pk])).status_code, 404)
        self.assertEqual(self.client.get(reverse('question_list')).context['paginator'].count, 0)
        self.assertEqual(self.client.get(reverse('student_dashboard')).status_code, 403)

    def test_signup_flows(self):
        self.client.logout()
        r = self.client.post(reverse('student_signup'), {
            'email': 'newbie@example.com', 'password': 'Str0ngPass!9'})
        self.assertRedirects(r, reverse('login'), fetch_redirect_response=False)
        self.assertNotIn('_auth_user_id', self.client.session)
        self.assertEqual(User.objects.get(email='newbie@example.com').role, 'student')
        self.assertEqual(self.client.get('/signup/company/').status_code, 404)
