from django.urls import path

from . import views

urlpatterns = [
    path('manage/exams/', views.ExamListView.as_view(), name='exam_list'),
    path('manage/exams/new/', views.ExamCreateView.as_view(), name='exam_create'),
    path('manage/exams/<int:pk>/edit/', views.ExamUpdateView.as_view(), name='exam_edit'),
    path('company/', views.CompanyHomeView.as_view(), name='company_home'),
    path('results/<int:pk>/', views.ExamResultsView.as_view(), name='exam_results'),
    path('results/<int:pk>/export.csv', views.ExamResultsCSVView.as_view(), name='exam_results_csv'),
]
