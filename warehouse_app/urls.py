from django.urls import path
from .views import (
    UserLoginView,
    UserRegistrationView,
    LogoutView,
    CategoryListCreateView,
    CategoryDetailView,
    ProductListCreateView,
    ProductDetailView,
)

urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("login/", UserLoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    # Category Endpoints
    path("categories/", CategoryListCreateView.as_view(), name="category-list"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),
    # Product Endpoints
    path("products/", ProductListCreateView.as_view(), name="add-product"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
]
