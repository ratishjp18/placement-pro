from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Company, User


@admin.register(User)
class PlacementUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (('Placement', {'fields': ('role', 'roll_number')}),)
    list_display = ('username', 'role', 'roll_number', 'is_active')
    list_filter = ('role',)


admin.site.register(Company)
