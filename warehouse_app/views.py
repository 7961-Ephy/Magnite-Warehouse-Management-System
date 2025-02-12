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
    lookup_field = "product_id"


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
    permission_classes = []
    authentication_classes = []
    csrf_exempt = True

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
        with transaction.atomic():
            transaction_obj = Transaction.objects.get(
                stripe_payment_intent_id=payment_intent["id"]
            )
            order = transaction_obj.order

            # Update transaction status
            transaction_obj.payment_status = "completed"
            transaction_obj.save()

            # Update order status
            order.payment_status = "paid"
            order.order_status = "processed"
            order.save()

            # Now reduce stock quantities
            order_items = order.items.all()
            for item in order_items:
                product = item.product
                product.stock_quantity -= item.quantity
                product.save()

    def handle_failed_payment(self, payment_intent):
        with transaction.atomic():
            transaction_obj = Transaction.objects.get(
                stripe_payment_intent_id=payment_intent["id"]
            )
            order = transaction_obj.order

            # Update transaction status
            transaction_obj.payment_status = "failed"
            transaction_obj.save()

            # Update order status but keep it pending
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

            if not items:
                return Response(
                    {"error": "No items provided"}, status=status.HTTP_400_BAD_REQUEST
                )

            # First check for existing pending orders
            existing_pending_order = Order.objects.filter(
                user=user, payment_status="pending", order_status="pending"
            ).first()

            if existing_pending_order:
                # Check if the items and total price match
                existing_items = existing_pending_order.items.all()
                existing_items_data = [
                    {
                        "product": item.product.product_id,
                        "quantity": item.quantity,
                        "price": float(item.price),
                    }
                    for item in existing_items
                ]

                # Sort both lists to ensure consistent comparison
                existing_items_data = sorted(
                    existing_items_data, key=lambda x: x["product"]
                )
                new_items = sorted(items, key=lambda x: x["product"])

                # Check if the orders match
                orders_match = (
                    len(existing_items_data) == len(new_items)
                    and all(
                        existing_item["product"] == new_item["product"]
                        and existing_item["quantity"] == new_item["quantity"]
                        and abs(existing_item["price"] - new_item["price"])
                        < 0.01  # Using small delta for float comparison
                        for existing_item, new_item in zip(
                            existing_items_data, new_items
                        )
                    )
                    and abs(
                        float(existing_pending_order.total_price) - float(total_price)
                    )
                    < 0.01
                )

                if orders_match:
                    return Response(
                        {
                            "id": existing_pending_order.id,
                            "order_number": existing_pending_order.order_number,
                            "message": "Using existing pending order",
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    # If the orders don't match, cancel the existing order and create a new one
                    existing_pending_order.order_status = "cancelled"
                    existing_pending_order.payment_status = "cancelled"
                    existing_pending_order.save()

            # Create new order
            with transaction.atomic():
                # Generate unique order number
                order_number = str(uuid.uuid4())[:8]

                # Create the order
                order = Order.objects.create(
                    user=user,
                    order_number=order_number,
                    total_price=total_price,
                    order_status="pending",
                    payment_status="pending",
                )

                # Validate and create order items
                for item in items:
                    product = Product.objects.get(product_id=item["product"])

                    if abs(float(product.price_per_unit) - float(item["price"])) > 0.01:
                        raise ValidationError(
                            f"Price mismatch for {product.name}. Expected: {product.price_per_unit}, Got: {item['price']}"
                        )

                    # Check stock availability
                    if product.stock_quantity < item["quantity"]:
                        raise ValidationError(f"Not enough stock for {product.name}")

                    # Create order item
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

        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
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


class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            print(f"Attempting to find order {pk} for user {request.user.id}")

            # Check if order exists
            order = Order.objects.filter(id=pk).first()
            if not order:
                print(f"Order {pk} not found")
                return Response(
                    {"error": f"Order {pk} not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Check if user owns the order
            if order.user != request.user:
                print(f"Order {pk} does not belong to user {request.user.id}")
                return Response(
                    {"error": "Not authorized to cancel this order"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            print(
                f"Found order: {order.id}, status: {order.order_status}, payment: {order.payment_status}"
            )

            # Only allow cancellation of pending or failed payment orders
            if order.payment_status not in ["pending", "failed"]:
                print(
                    f"Cannot cancel order with payment status: {order.payment_status}"
                )
                return Response(
                    {"error": "Cannot cancel orders that have been paid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                with transaction.atomic():
                    # Update order status
                    order.order_status = "cancelled"
                    order.payment_status = "cancelled"
                    order.save()
                    print(f"Updated order {order.id} status to cancelled")

                    # If there are any transactions, mark them as cancelled
                    # Using the correct related_name 'transactions' instead of 'transaction_set'
                    order.transactions.all().update(payment_status="failed")
                    print(f"Updated transactions to failed")

                    # Return any reserved stock
                    order_items = order.items.all()
                    for item in order_items:
                        product = item.product
                        # Only add back to stock if it was previously reserved
                        if order.order_status == "pending":
                            product.stock_quantity += item.quantity
                            product.save()
                            print(
                                f"Returned {item.quantity} units to product {product.id}"
                            )

                return Response(
                    {"message": "Order cancelled successfully"},
                    status=status.HTTP_200_OK,
                )

            except Exception as e:
                print(f"Database transaction error: {str(e)}")
                return Response(
                    {"error": "Error updating order status"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        except Exception as e:
            import traceback

            print(f"Error in CancelOrderView: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


# views.py
class VerifyCartPricesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart_items = request.data.get("items", [])
        verification_results = []

        for item in cart_items:
            product = Product.objects.get(product_id=item["product_id"])
            verification_results.append(
                {
                    "product_id": item["product_id"],
                    "name": product.name,
                    "current_price": str(product.price_per_unit),
                    "cart_price": str(item["price_per_unit"]),
                    "price_matched": abs(
                        float(product.price_per_unit) - float(item["price_per_unit"])
                    )
                    < 0.01,
                }
            )

        return Response(verification_results)
