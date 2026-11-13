from django.contrib.auth.views import LogoutView
from django.urls import path

from . import views

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('login/', views.RoleLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('manage/companies/', views.CompanyListView.as_view(), name='company_list'),
    path('manage/companies/new/', views.CompanyCreateView.as_view(), name='company_create'),
    path('manage/students/', views.StudentListView.as_view(), name='student_list'),
    path('manage/students/new/', views.StudentCreateView.as_view(), name='student_create'),
]
