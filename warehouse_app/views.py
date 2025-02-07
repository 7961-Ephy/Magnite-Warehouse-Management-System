import stripe
import uuid
from django.conf import settings
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.exceptions import ValidationError
from .serializers import (
    CustomUserSerializer,
    UserLoginSerializer,
    ProductSerializer,
    CategorySerializer,
    OrderSerializer,
    TransactionSerializer,
)
from .models import CustomUser, Product, Category, Order, Transaction, OrderItem

stripe.api_key = settings.STRIPE_SECRET_KEY


# Create your views here.
class UserLoginView(APIView):
    permission_classes = [AllowAny]  # Allow login without authentication

    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            return Response(
                {
                    "access_token": access_token,
                    "refresh_token": str(refresh),
                    "is_superuser": user.is_superuser,  # Add this instead of role
                    "user": {
                        "email": user.email,
                        "username": user.username,
                        "name": user.name,
                        "role": user.role,
                        "contact_info": user.contact_info,
                    },
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {"detail": "Invalid credentials"},  # More specific error message
            status=status.HTTP_400_BAD_REQUEST,
        )


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]  # Ensure registration is open

    def post(self, request, *args, **kwargs):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                CustomUserSerializer(user).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]  # Only logged-in users can log out

    def post(self, request):
        try:
            refresh_token = request.data[
                "refresh_token"
            ]  # Get refresh token from request
            token = RefreshToken(refresh_token)
            token.blacklist()  # Blacklist the refresh token

            return Response(
                {"message": "Logout successful"}, status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


# Category Views
class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


# Product Views
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]


class CreatePaymentIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            order_id = request.data.get("order_id")
            order = get_object_or_404(Order, id=order_id, user=request.user)

            # Create Stripe PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=int(order.total_price * 100),  # Convert to cents
                currency="usd",
                metadata={"order_id": order.id},
                automatic_payment_methods={"enabled": True},
            )

            # Create transaction record
            transaction = Transaction.objects.create(
                order=order,
                user=request.user,
                amount=order.total_price,
                stripe_payment_intent_id=intent.id,
            )

            return Response(
                {"clientSecret": intent.client_secret, "transaction_id": transaction.id}
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StripeWebhookView(APIView):
    permission_classes = []  # No authentication for Stripe webhooks
    authentication_classes = []  # Remove authentication classes
    csrf_exempt = True  # Exempt from CSRF

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )

            if event["type"] == "payment_intent.succeeded":
                payment_intent = event["data"]["object"]
                self.handle_successful_payment(payment_intent)
            elif event["type"] == "payment_intent.payment_failed":
                payment_intent = event["data"]["object"]
                self.handle_failed_payment(payment_intent)

            return Response({"status": "success"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def handle_successful_payment(self, payment_intent):
        transaction = Transaction.objects.get(
            stripe_payment_intent_id=payment_intent["id"]
        )
        order = transaction.order

        # Update transaction status
        transaction.payment_status = "completed"
        transaction.save()

        # Update order status
        order.payment_status = "paid"
        order.order_status = "processed"
        order.save()

    def handle_failed_payment(self, payment_intent):
        transaction = Transaction.objects.get(
            stripe_payment_intent_id=payment_intent["id"]
        )
        order = transaction.order

        # Update transaction status
        transaction.payment_status = "failed"
        transaction.save()

        # Update order status
        order.payment_status = "failed"
        order.save()


class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


class CreateOrderView(generics.CreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            user = request.user
            data = request.data
            items = data.get("items", [])
            total_price = data.get("total_price", 0)

            # Add logging to see what's being received
            print("Received data:", data)
            print("Items:", items)
            print("Total price:", total_price)

            if not items:
                return Response(
                    {"error": "No items provided"}, status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                order_number = str(uuid.uuid4())[:8]

                # Add logging for order creation
                print("Creating order with number:", order_number)

                order = Order.objects.create(
                    user=user,
                    order_number=order_number,
                    total_price=total_price,
                    order_status="pending",
                )

                # Add logging for items processing
                for item in items:
                    print("Processing item:", item)
                    product = Product.objects.get(product_id=item["product"])
                    if product.stock_quantity < item["quantity"]:
                        raise ValidationError(f"Not enough stock for {product.name}")

                    product.stock_quantity -= item["quantity"]
                    product.save()

                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=item["quantity"],
                        price=item["price"],
                    )

                return Response(
                    {"id": order.id, "order_number": order.order_number},
                    status=status.HTTP_201_CREATED,
                )

        except Product.DoesNotExist as e:
            return Response(
                {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Log the full error
            import traceback

            print("Error:", str(e))
            print("Traceback:", traceback.format_exc())
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrderPaymentStatusView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class UserOrdersListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by("-order_date")
