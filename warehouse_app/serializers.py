from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Product, Category, Order, OrderItem, Transaction


# Serializer for user registration and user details
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "username", "name", "role", "contact_info", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user


# Serializer for user login
class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={"input_type": "password"})

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        if email and password:
            user = authenticate(
                request=self.context.get("request"), email=email, password=password
            )
            if not user:
                raise serializers.ValidationError("Invalid email or password.")
            data["user"] = user
            return data
        else:
            raise serializers.ValidationError('Must include "email" and "password".')


# Serializer for category
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


# Serializer for products
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )

    class Meta:
        model = Product
        fields = [
            "product_id",
            "name",
            "category",
            "category_id",
            "stock_quantity",
            "price_per_unit",
            "reorder_threshold",
            "reorder_quantity",
            "image",
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "product", "quantity", "price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "order_status",
            "order_date",
            "total_price",
            "payment_status",
            "items",
        ]
        read_only_fields = ["order_number", "order_status", "payment_status"]


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "order",
            "transaction_date",
            "amount",
            "payment_status",
            "currency",
            "stripe_payment_intent_id",
        ]
        read_only_fields = [
            "transaction_date",
            "payment_status",
            "stripe_payment_intent_id",
        ]
