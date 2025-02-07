from django.urls import path
from .views import (
    UserLoginView,
    UserRegistrationView,
    LogoutView,
    CategoryListCreateView,
    CategoryDetailView,
    ProductListCreateView,
    ProductDetailView,
    CreatePaymentIntentView,
    StripeWebhookView,
    TransactionListView,
    OrderPaymentStatusView,
    CreateOrderView,
    UserOrdersListView,
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
    # Payment/Checkout Endpoints
    path(
        "create-payment-intent/",
        CreatePaymentIntentView.as_view(),
        name="create-payment-intent",
    ),
    path("stripe/webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("transactions/", TransactionListView.as_view(), name="transaction-list"),
    path("orders/", CreateOrderView.as_view(), name="create-order"),
    path(
        "orders/<int:pk>/payment-status/",
        OrderPaymentStatusView.as_view(),
        name="order-payment-status",
    ),
    path("orders/list/", UserOrdersListView.as_view(), name="user-orders-list"),
]
