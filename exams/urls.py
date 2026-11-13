from django.urls import path

from . import views

urlpatterns = [
    path('company/exams/', views.ExamListView.as_view(), name='exam_list'),
    path('company/exams/new/', views.ExamCreateView.as_view(), name='exam_create'),
    path('company/exams/<int:pk>/edit/', views.ExamUpdateView.as_view(), name='exam_edit'),
    path('company/exams/<int:pk>/results/', views.ExamResultsView.as_view(), name='exam_results'),
    path('company/exams/<int:pk>/results.csv', views.ExamResultsCSVView.as_view(), name='exam_results_csv'),
]
