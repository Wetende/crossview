from django.urls import path

from . import views

app_name = "commerce"

urlpatterns = [
    path("commerce/checkout/preview/", views.checkout_preview, name="checkout_preview"),
    path("commerce/cart/", views.cart_detail, name="cart_detail"),
    path("commerce/cart/items/", views.cart_add_item, name="cart_add_item"),
    path(
        "commerce/cart/items/<int:program_id>/",
        views.cart_remove_item,
        name="cart_remove_item",
    ),
    path("commerce/cart/clear/", views.cart_clear, name="cart_clear"),
    path("commerce/orders/", views.commerce_orders, name="orders"),
    path("commerce/wishlist/", views.wishlist_list, name="wishlist_list"),
    path("commerce/wishlist/items/", views.wishlist_add_item, name="wishlist_add_item"),
    path(
        "commerce/wishlist/items/<int:program_id>/",
        views.wishlist_remove_item,
        name="wishlist_remove_item",
    ),
    path("commerce/wishlist/sync/", views.wishlist_sync, name="wishlist_sync"),
    path(
        "commerce/orders/<int:order_id>/",
        views.commerce_order_detail,
        name="order_detail",
    ),
    path(
        "commerce/orders/<int:order_id>/status/",
        views.commerce_order_status,
        name="order_status",
    ),
    path(
        "commerce/orders/<int:order_id>/paystack/initialize/",
        views.commerce_order_paystack_initialize,
        name="order_paystack_initialize",
    ),
    path(
        "commerce/orders/<int:order_id>/paystack/charge/mpesa/",
        views.commerce_order_paystack_charge_mpesa,
        name="order_paystack_charge_mpesa",
    ),
    path(
        "commerce/orders/<int:order_id>/paystack/verify/",
        views.commerce_order_paystack_verify,
        name="order_paystack_verify",
    ),
    path("payments/paystack/callback/", views.paystack_callback, name="paystack_callback"),
    path("webhooks/paystack/", views.paystack_webhook, name="paystack_webhook"),
    path("student/orders/", views.student_orders, name="student_orders"),
    path(
        "student/orders/<int:order_id>/",
        views.student_order_detail,
        name="student_order_detail",
    ),
    path("admin/commerce/orders/", views.admin_commerce_orders, name="admin_orders"),
    path(
        "admin/commerce/orders/<int:order_id>/mark-paid/",
        views.admin_mark_order_paid,
        name="admin_mark_order_paid",
    ),
    path(
        "admin/commerce/orders/<int:order_id>/cancel/",
        views.admin_cancel_order,
        name="admin_cancel_order",
    ),
    path(
        "admin/commerce/orders/<int:order_id>/refund/",
        views.admin_refund_order,
        name="admin_refund_order",
    ),
    path(
        "admin/commerce/refunds/<int:refund_id>/retry/",
        views.admin_retry_refund,
        name="admin_retry_refund",
    ),
    path(
        "admin/commerce/payouts/",
        views.admin_commerce_payouts,
        name="admin_payouts",
    ),
    path(
        "admin/commerce/payouts/<int:payout_id>/send/",
        views.admin_send_payout,
        name="admin_send_payout",
    ),
    path("programs/<int:pk>/checkout/", views.program_checkout, name="checkout"),
    path(
        "programs/<int:pk>/checkout/initialize/",
        views.program_checkout_initialize,
        name="checkout_initialize",
    ),
    # Inertia page shells (client-side data fetching)
    path("cart/", views.cart_page, name="cart_page"),
    path("checkout/", views.checkout_page, name="checkout_page"),
    path("wishlist/", views.wishlist_page, name="wishlist_page"),
    path(
        "commerce/orders/<int:order_id>/page/",
        views.order_detail_page,
        name="order_detail_page",
    ),
    path(
        "admin/commerce/orders/page/",
        views.admin_commerce_orders_page,
        name="admin_orders_page",
    ),
]
