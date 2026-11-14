from django.urls import path

from . import views as v

urlpatterns = [
    path('auth/me/', v.me),
    path('auth/login/', v.login_view),
    path('auth/logout/', v.logout_view),
    path('auth/register/', v.register),

    path('student/home/', v.student_home),
    path('student/exams/<int:pk>/', v.student_intro),
    path('student/exams/<int:pk>/start/', v.student_start),
    path('attempts/<int:pk>/', v.attempt_detail),
    path('attempts/<int:pk>/begin/', v.attempt_begin),
    path('attempts/<int:pk>/answer/', v.attempt_answer),
    path('attempts/<int:pk>/violation/', v.attempt_violation),
    path('attempts/<int:pk>/submit/', v.attempt_submit),
    path('attempts/<int:pk>/result/', v.attempt_result),

    path('company/exams/', v.company_exams),
    path('company/exams/<int:pk>/', v.company_exam),
    path('company/exams/<int:pk>/results/', v.company_results),
    path('company/exams/<int:pk>/results.csv', v.company_results_csv),
    path('company/questions/', v.company_questions),
    path('company/questions/import/', v.company_import),
    path('company/questions/sample.csv', v.company_sample_csv),
    path('company/questions/<int:pk>/', v.company_question),
]
