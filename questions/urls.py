from django.urls import path

from . import views

urlpatterns = [
    path('', views.QuestionListView.as_view(), name='question_list'),
    path('new/', views.QuestionCreateView.as_view(), name='question_create'),
    path('import/', views.QuestionImportView.as_view(), name='question_import'),
    path('import/sample/', views.SampleCSVView.as_view(), name='question_sample_csv'),
    path('<int:pk>/edit/', views.QuestionUpdateView.as_view(), name='question_edit'),
    path('<int:pk>/delete/', views.QuestionDeleteView.as_view(), name='question_delete'),
]
