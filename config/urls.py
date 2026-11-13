from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('', include('accounts.urls')),
    path('manage/questions/', include('questions.urls')),
    path('', include('exams.urls')),
    path('', include('attempts.urls')),
]
