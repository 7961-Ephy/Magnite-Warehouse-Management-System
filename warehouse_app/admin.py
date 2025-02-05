from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


# Customizing UserAdmin
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = (
        "email",
        "username",
        "role",
        "is_staff",
        "is_active",
    )  # Use 'role' instead of is_admin/is_trader
    list_filter = ("role", "is_staff", "is_active")  # Filter by 'role'

    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Permissions", {"fields": ("role", "is_staff", "is_superuser")}),
        ("Personal Info", {"fields": ("date_joined",)}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "password1",
                    "password2",
                    "role",
                    "is_staff",
                ),
            },
        ),
    )

    search_fields = ("email", "username")
    ordering = ("email",)


# Registering the model with the custom admin class
admin.site.register(CustomUser, CustomUserAdmin)
