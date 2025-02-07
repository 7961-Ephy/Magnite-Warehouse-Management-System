from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.exceptions import ValidationError
from django.db import models
from django.conf import settings
import phonenumbers


class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    # Role choices
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("trader", "Trader"),
    )

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    contact_info = models.JSONField(blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="trader")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = CustomUserManager()

    def clean(self):
        super().clean()
        if self.contact_info and "additional_contact" in self.contact_info:
            try:
                phone = phonenumbers.parse(
                    self.contact_info["additional_contact"], "KE"
                )
                if not phonenumbers.is_valid_number(phone):
                    raise ValidationError(
                        {"contact_info": "Please enter a valid phone number"}
                    )
            except phonenumbers.NumberParseException:
                raise ValidationError(
                    {"contact_info": "Please enter a valid phone number format"}
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=255)

    def __str__(self):
        return self.category_name


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    stock_quantity = models.IntegerField()
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    reorder_threshold = models.PositiveIntegerField()
    reorder_quantity = models.PositiveIntegerField()
    image = models.ImageField(
        upload_to="product_images/", null=True, blank=True
    )  # Image Field

    def __str__(self):
        return self.name


class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order_number = models.CharField(max_length=20, unique=True)
    order_status = models.CharField(
        max_length=20, choices=ORDER_STATUS_CHOICES, default="pending"
    )
    order_date = models.DateTimeField(auto_now_add=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_status = models.CharField(
        max_length=20,
        choices=[("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed")],
        default="pending",
    )

    def __str__(self):
        return f"Order {self.order_number} - {self.user.email}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("Product", on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(
        max_digits=10, decimal_places=2
    )  # Store price at time of order

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in Order {self.order.id}"


class Transaction(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="transactions"
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    transaction_date = models.DateTimeField(auto_now_add=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
        default="pending",
    )
    currency = models.CharField(max_length=10, default="USD")
    stripe_payment_intent_id = models.CharField(
        max_length=255, unique=True, null=True, blank=True
    )  # Stripe Payment ID
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Transaction {self.id} - Order {self.order.id} - {self.payment_status}"
