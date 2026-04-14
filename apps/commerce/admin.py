from django.contrib import admin

from .models import (
    BeneficiaryPayout,
    Cart,
    CartItem,
    CommerceConfiguration,
    Order,
    OrderEvent,
    OrderItem,
    PaymentAttempt,
    ProgramAccessGrant,
    ProgramRevenueShare,
    Refund,
    RefundItem,
    RevenueLedgerEntry,
    SettlementParty,
    WebhookEvent,
)


@admin.register(CommerceConfiguration)
class CommerceConfigurationAdmin(admin.ModelAdmin):
    list_display = ("singleton_key", "created_at", "updated_at")


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "program",
        "program_name",
        "program_code",
        "amount_minor",
        "refunded_minor",
        "currency",
        "status",
        "paid_at",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "user",
        "program",
        "status",
        "provider",
        "currency",
        "total_minor",
        "refunded_minor",
        "created_at",
    )
    list_filter = ("status", "provider", "currency")
    search_fields = ("reference", "provider_reference", "user__email", "program__name")
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "program_name",
        "status",
        "amount_minor",
        "refunded_minor",
        "currency",
        "paid_at",
    )
    list_filter = ("status", "currency")
    search_fields = ("order__reference", "program_name", "program_code")


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "currency", "checked_out_at", "created_at")
    list_filter = ("status", "currency")
    search_fields = ("user__email",)


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "program", "amount_minor", "currency", "created_at")
    list_filter = ("currency",)
    search_fields = ("cart__user__email", "program__name")


@admin.register(ProgramAccessGrant)
class ProgramAccessGrantAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "program",
        "status",
        "order_item",
        "granted_at",
        "revoked_at",
    )
    list_filter = ("status", "source_type")
    search_fields = ("user__email", "program__name", "order_item__order__reference")


class RefundItemInline(admin.TabularInline):
    model = RefundItem
    extra = 0
    readonly_fields = ("order_item", "amount_minor", "status", "processed_at")


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "provider",
        "status",
        "amount_minor",
        "provider_refund_id",
        "processed_at",
        "created_at",
    )
    list_filter = ("status", "provider")
    search_fields = ("order__reference", "provider_refund_id", "reason")
    inlines = [RefundItemInline]


@admin.register(PaymentAttempt)
class PaymentAttemptAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "refund",
        "payout",
        "provider",
        "state",
        "provider_reference",
        "created_at",
    )
    list_filter = ("provider", "state")
    search_fields = ("provider_reference", "order__reference", "refund__provider_refund_id")


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "provider",
        "event_type",
        "reference",
        "refund_reference",
        "dedupe_key",
        "signature_valid",
        "processed_at",
        "created_at",
    )
    list_filter = ("provider", "signature_valid", "event_type")
    search_fields = ("dedupe_key", "reference", "refund_reference", "event_id")


@admin.register(OrderEvent)
class OrderEventAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "refund", "actor", "event_type", "created_at")
    list_filter = ("event_type",)
    search_fields = ("order__reference", "refund__provider_refund_id", "message")


@admin.register(SettlementParty)
class SettlementPartyAdmin(admin.ModelAdmin):
    list_display = (
        "display_name",
        "party_type",
        "payout_method",
        "user",
        "active",
        "paystack_recipient_code",
        "updated_at",
    )
    list_filter = ("party_type", "payout_method", "active")
    search_fields = ("display_name", "email", "phone", "paystack_recipient_code")


@admin.register(ProgramRevenueShare)
class ProgramRevenueShareAdmin(admin.ModelAdmin):
    list_display = ("program", "settlement_party", "share_bps", "active", "updated_at")
    list_filter = ("active", "settlement_party__party_type")
    search_fields = ("program__name", "program__code", "settlement_party__display_name")


@admin.register(RevenueLedgerEntry)
class RevenueLedgerEntryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "settlement_party",
        "entry_type",
        "direction",
        "amount_minor",
        "currency",
        "order",
        "refund",
        "created_at",
    )
    list_filter = ("entry_type", "direction", "currency")
    search_fields = (
        "settlement_party__display_name",
        "order__reference",
        "refund__provider_refund_id",
        "external_key",
    )


@admin.register(BeneficiaryPayout)
class BeneficiaryPayoutAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "settlement_party",
        "amount_minor",
        "currency",
        "status",
        "reference",
        "provider_reference",
        "processed_at",
        "created_at",
    )
    list_filter = ("status", "currency", "provider")
    search_fields = (
        "settlement_party__display_name",
        "reference",
        "provider_reference",
        "failure_reason",
    )
