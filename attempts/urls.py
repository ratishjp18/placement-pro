from django.urls import path

from . import views

urlpatterns = [
    path('student/', views.StudentDashboardView.as_view(), name='student_dashboard'),
    path('student/exam/<int:pk>/', views.ExamIntroView.as_view(), name='exam_intro'),
    path('attempt/<int:pk>/', views.AttemptTakeView.as_view(), name='attempt_take'),
    path('attempt/<int:pk>/answer/', views.AnswerView.as_view(), name='attempt_answer'),
    path('attempt/<int:pk>/violation/', views.ViolationView.as_view(), name='attempt_violation'),
    path('attempt/<int:pk>/submit/', views.SubmitView.as_view(), name='attempt_submit'),
    path('attempt/<int:pk>/result/', views.ResultView.as_view(), name='attempt_result'),
]
