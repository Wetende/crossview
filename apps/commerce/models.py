from django.db import models
from django.db.models import Q
from django.utils import timezone

from apps.core.models import TimeStampedModel


def default_enabled_payment_methods():
    return {
        "paystack": True,
        "offline_bank_transfer": True,
    }


class CommerceConfiguration(TimeStampedModel):
    singleton_key = models.CharField(max_length=32, unique=True, default="default")
    enabled_payment_methods = models.JSONField(
        default=default_enabled_payment_methods,
        blank=True,
    )
    offline_bank_details = models.JSONField(default=dict, blank=True)
    offline_payment_instructions = models.TextField(blank=True, default="")

    class Meta:
        db_table = "commerce_configuration"

    def __str__(self):
        return "Commerce configuration"

    @classmethod
    def get_solo(cls):
        config, _ = cls.objects.get_or_create(singleton_key="default")
        return config

    def is_method_enabled(self, method: str) -> bool:
        default_methods = default_enabled_payment_methods()
        return bool(
            (self.enabled_payment_methods or {}).get(
                method,
                default_methods.get(method, False),
            )
        )


class Cart(TimeStampedModel):
    STATUS_ACTIVE = "active"
    STATUS_CHECKED_OUT = "checked_out"
    STATUS_ABANDONED = "abandoned"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_CHECKED_OUT, "Checked out"),
        (STATUS_ABANDONED, "Abandoned"),
    ]

    user = models.ForeignKey("core.User", on_delete=models.CASCADE, related_name="carts")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    currency = models.CharField(max_length=8, blank=True, default="")
    checked_out_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "commerce_carts"
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(status="active"),
                name="commerce_one_active_cart_per_user",
            )
        ]
        indexes = [
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"Cart({self.user_id}, {self.status})"


class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    program = models.ForeignKey("core.Program", on_delete=models.CASCADE, related_name="cart_items")
    amount_minor = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=8, default="KES")

    class Meta:
        db_table = "commerce_cart_items"
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "program"],
                name="commerce_unique_cart_program",
            )
        ]
        indexes = [
            models.Index(fields=["cart", "created_at"]),
            models.Index(fields=["program"]),
        ]

    def __str__(self):
        return f"CartItem(cart={self.cart_id}, program={self.program_id})"


class WishlistItem(TimeStampedModel):
    user = models.ForeignKey("core.User", on_delete=models.CASCADE, related_name="wishlist_items")
    program = models.ForeignKey("core.Program", on_delete=models.CASCADE, related_name="wishlist_items")

    class Meta:
        db_table = "commerce_wishlist_items"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "program"],
                name="commerce_unique_wishlist_user_program",
            )
        ]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["program"]),
        ]

    def __str__(self):
        return f"WishlistItem(user={self.user_id}, program={self.program_id})"


class Order(TimeStampedModel):
    STATUS_CREATED = "created"
    STATUS_PENDING_PAYMENT = "pending_payment"
    STATUS_PENDING_MANUAL_PAYMENT = "pending_manual_payment"
    STATUS_PAID = "paid"
    STATUS_FAILED = "failed"
    STATUS_CANCELLED = "cancelled"
    STATUS_EXPIRED = "expired"
    STATUS_PARTIALLY_REFUNDED = "partially_refunded"
    STATUS_REFUNDED = "refunded"

    STATUS_CHOICES = [
        (STATUS_CREATED, "Created"),
        (STATUS_PENDING_PAYMENT, "Pending payment"),
        (STATUS_PENDING_MANUAL_PAYMENT, "Pending manual payment"),
        (STATUS_PAID, "Paid"),
        (STATUS_FAILED, "Failed"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_PARTIALLY_REFUNDED, "Partially refunded"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    PROVIDER_PAYSTACK = "paystack"
    PROVIDER_OFFLINE_BANK_TRANSFER = "offline_bank_transfer"

    PROVIDER_CHOICES = [
        (PROVIDER_PAYSTACK, "Paystack"),
        (PROVIDER_OFFLINE_BANK_TRANSFER, "Offline bank transfer"),
    ]

    user = models.ForeignKey("core.User", on_delete=models.CASCADE, related_name="orders")
    cart = models.ForeignKey(
        Cart,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    # Legacy compatibility field. New multi-program orders leave this null.
    program = models.ForeignKey(
        "core.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="legacy_orders",
    )
    # Legacy compatibility field. New multi-program orders leave this null.
    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    provider = models.CharField(
        max_length=32,
        choices=PROVIDER_CHOICES,
        default=PROVIDER_PAYSTACK,
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_CREATED)
    # Legacy compatibility alias for the total amount.
    amount_minor = models.PositiveIntegerField(default=0)
    subtotal_minor = models.PositiveIntegerField(default=0)
    tax_minor = models.PositiveIntegerField(default=0)
    total_minor = models.PositiveIntegerField(default=0)
    refunded_minor = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=8, default="KES")
    reference = models.CharField(max_length=128, unique=True)
    provider_reference = models.CharField(max_length=128, blank=True, default="")
    paid_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "orders"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["currency", "status"]),
            models.Index(fields=["provider", "reference"]),
        ]

    def __str__(self):
        return f"Order({self.reference}, {self.status})"


class OrderItem(TimeStampedModel):
    STATUS_PENDING = "pending"
    STATUS_PAID = "paid"
    STATUS_REFUNDED = "refunded"
    STATUS_CANCELLED = "cancelled"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_REFUNDED, "Refunded"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_FAILED, "Failed"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    program = models.ForeignKey(
        "core.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    program_name = models.CharField(max_length=255)
    program_code = models.CharField(max_length=50, blank=True, default="")
    currency = models.CharField(max_length=8, default="KES")
    amount_minor = models.PositiveIntegerField(default=0)
    refunded_minor = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    paid_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "commerce_order_items"
        constraints = [
            models.UniqueConstraint(
                fields=["order", "program"],
                name="commerce_unique_order_program",
            )
        ]
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["program", "status"]),
        ]

    def __str__(self):
        return f"OrderItem(order={self.order_id}, program={self.program_id})"


class ProgramAccessGrant(TimeStampedModel):
    STATUS_ACTIVE = "active"
    STATUS_REVOKED = "revoked"
    STATUS_EXPIRED = "expired"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_REVOKED, "Revoked"),
        (STATUS_EXPIRED, "Expired"),
    ]

    user = models.ForeignKey(
        "core.User",
        on_delete=models.CASCADE,
        related_name="program_access_grants",
    )
    program = models.ForeignKey(
        "core.Program",
        on_delete=models.CASCADE,
        related_name="access_grants",
    )
    order_item = models.OneToOneField(
        OrderItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="access_grant",
    )
    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="access_grants",
    )
    source_type = models.CharField(max_length=32, default="order_item")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    granted_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "commerce_program_access_grants"
        indexes = [
            models.Index(fields=["user", "program", "status"]),
            models.Index(fields=["status", "expires_at"]),
        ]

    def __str__(self):
        return f"ProgramAccessGrant(user={self.user_id}, program={self.program_id}, {self.status})"


class SettlementParty(TimeStampedModel):
    TYPE_INSTRUCTOR = "instructor"
    TYPE_PARTNER = "partner"

    TYPE_CHOICES = [
        (TYPE_INSTRUCTOR, "Instructor"),
        (TYPE_PARTNER, "Partner"),
    ]

    PAYOUT_METHOD_KEPSS = "kepss"
    PAYOUT_METHOD_MOBILE_MONEY = "mobile_money"

    PAYOUT_METHOD_CHOICES = [
        (PAYOUT_METHOD_KEPSS, "KEPSS bank account"),
        (PAYOUT_METHOD_MOBILE_MONEY, "Mobile money"),
    ]

    party_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    display_name = models.CharField(max_length=255)
    user = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="settlement_parties",
    )
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=50, blank=True, default="")
    payout_method = models.CharField(max_length=32, choices=PAYOUT_METHOD_CHOICES)
    destination_details = models.JSONField(default=dict, blank=True)
    active = models.BooleanField(default=True)
    paystack_recipient_code = models.CharField(max_length=128, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "commerce_settlement_parties"
        indexes = [
            models.Index(fields=["party_type", "active"]),
            models.Index(fields=["user", "active"]),
        ]

    def __str__(self):
        return f"{self.display_name} ({self.party_type})"


class ProgramRevenueShare(TimeStampedModel):
    program = models.ForeignKey(
        "core.Program",
        on_delete=models.CASCADE,
        related_name="revenue_shares",
    )
    settlement_party = models.ForeignKey(
        SettlementParty,
        on_delete=models.CASCADE,
        related_name="program_revenue_shares",
    )
    share_bps = models.PositiveIntegerField()
    active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "commerce_program_revenue_shares"
        constraints = [
            models.UniqueConstraint(
                fields=["program", "settlement_party"],
                name="commerce_unique_program_settlement_party_share",
            )
        ]
        indexes = [
            models.Index(fields=["program", "active"]),
            models.Index(fields=["settlement_party", "active"]),
        ]

    def __str__(self):
        return f"{self.program_id} -> {self.settlement_party_id} ({self.share_bps}bps)"


class RevenueLedgerEntry(TimeStampedModel):
    DIRECTION_CREDIT = "credit"
    DIRECTION_DEBIT = "debit"

    DIRECTION_CHOICES = [
        (DIRECTION_CREDIT, "Credit"),
        (DIRECTION_DEBIT, "Debit"),
    ]

    ENTRY_PAYMENT_SHARE = "payment_share"
    ENTRY_REFUND_REVERSAL = "refund_reversal"

    ENTRY_TYPE_CHOICES = [
        (ENTRY_PAYMENT_SHARE, "Payment share"),
        (ENTRY_REFUND_REVERSAL, "Refund reversal"),
    ]

    settlement_party = models.ForeignKey(
        SettlementParty,
        on_delete=models.CASCADE,
        related_name="ledger_entries",
    )
    program = models.ForeignKey(
        "core.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revenue_ledger_entries",
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="ledger_entries",
    )
    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.CASCADE,
        related_name="ledger_entries",
    )
    refund = models.ForeignKey(
        "Refund",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )
    refund_item = models.ForeignKey(
        "RefundItem",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )
    external_key = models.CharField(max_length=255, unique=True)
    direction = models.CharField(max_length=16, choices=DIRECTION_CHOICES)
    entry_type = models.CharField(max_length=32, choices=ENTRY_TYPE_CHOICES)
    amount_minor = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=8, default="KES")
    share_bps_snapshot = models.PositiveIntegerField(default=0)
    settlement_party_snapshot = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "commerce_revenue_ledger_entries"
        indexes = [
            models.Index(fields=["settlement_party", "currency", "direction"]),
            models.Index(fields=["order", "entry_type"]),
            models.Index(fields=["refund", "entry_type"]),
        ]

    def __str__(self):
        return f"{self.entry_type} {self.direction} {self.amount_minor} for {self.settlement_party_id}"


class Refund(TimeStampedModel):
    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_PROCESSED = "processed"
    STATUS_FAILED = "failed"
    STATUS_NEEDS_ATTENTION = "needs_attention"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_PROCESSED, "Processed"),
        (STATUS_FAILED, "Failed"),
        (STATUS_NEEDS_ATTENTION, "Needs attention"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="refunds")
    requested_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requested_refunds",
    )
    processed_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_refunds",
    )
    provider = models.CharField(max_length=32, choices=Order.PROVIDER_CHOICES, default=Order.PROVIDER_PAYSTACK)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_PENDING)
    amount_minor = models.PositiveIntegerField(default=0)
    provider_refund_id = models.CharField(max_length=128, blank=True, default="")
    reason = models.CharField(max_length=255, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    processed_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "commerce_refunds"
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["provider", "provider_refund_id"]),
        ]

    def __str__(self):
        return f"Refund(order={self.order_id}, {self.status})"


class RefundItem(TimeStampedModel):
    STATUS_PENDING = "pending"
    STATUS_PROCESSED = "processed"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSED, "Processed"),
        (STATUS_FAILED, "Failed"),
    ]

    refund = models.ForeignKey(Refund, on_delete=models.CASCADE, related_name="items")
    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.CASCADE,
        related_name="refund_items",
    )
    amount_minor = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    processed_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "commerce_refund_items"
        constraints = [
            models.UniqueConstraint(
                fields=["refund", "order_item"],
                name="commerce_unique_refund_order_item",
            )
        ]
        indexes = [
            models.Index(fields=["refund", "status"]),
            models.Index(fields=["order_item", "status"]),
        ]

    def __str__(self):
        return f"RefundItem(refund={self.refund_id}, order_item={self.order_item_id})"


class BeneficiaryPayout(TimeStampedModel):
    STATUS_PENDING_APPROVAL = "pending_approval"
    STATUS_PROCESSING = "processing"
    STATUS_PAID = "paid"
    STATUS_FAILED = "failed"
    STATUS_REVERSED = "reversed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING_APPROVAL, "Pending approval"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_PAID, "Paid"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REVERSED, "Reversed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    settlement_party = models.ForeignKey(
        SettlementParty,
        on_delete=models.CASCADE,
        related_name="payouts",
    )
    requested_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requested_beneficiary_payouts",
    )
    processed_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_beneficiary_payouts",
    )
    provider = models.CharField(max_length=32, default=Order.PROVIDER_PAYSTACK)
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING_APPROVAL,
    )
    amount_minor = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=8, default="KES")
    reference = models.CharField(max_length=128, blank=True, null=True, unique=True)
    provider_reference = models.CharField(max_length=128, blank=True, default="")
    processed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "commerce_beneficiary_payouts"
        indexes = [
            models.Index(fields=["settlement_party", "currency", "status"]),
            models.Index(fields=["provider", "provider_reference"]),
        ]

    def __str__(self):
        return f"Payout({self.settlement_party_id}, {self.amount_minor}, {self.status})"


class PaymentAttempt(TimeStampedModel):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="attempts",
        null=True,
        blank=True,
    )
    refund = models.ForeignKey(
        Refund,
        on_delete=models.CASCADE,
        related_name="attempts",
        null=True,
        blank=True,
    )
    payout = models.ForeignKey(
        BeneficiaryPayout,
        on_delete=models.CASCADE,
        related_name="attempts",
        null=True,
        blank=True,
    )
    provider = models.CharField(max_length=32, default="paystack")
    state = models.CharField(max_length=64, default="initialized")
    provider_reference = models.CharField(max_length=128, blank=True, default="")
    request_payload = models.JSONField(default=dict, blank=True)
    response_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "payment_attempts"
        indexes = [
            models.Index(fields=["order", "created_at"]),
            models.Index(fields=["refund", "created_at"]),
            models.Index(fields=["payout", "created_at"]),
            models.Index(fields=["provider", "provider_reference"]),
        ]

    def __str__(self):
        return f"PaymentAttempt({self.provider}, {self.state})"


class WebhookEvent(TimeStampedModel):
    provider = models.CharField(max_length=32, default="paystack")
    event_type = models.CharField(max_length=64, blank=True, default="")
    event_id = models.CharField(max_length=255, blank=True, default="")
    reference = models.CharField(max_length=255, blank=True, default="")
    refund_reference = models.CharField(max_length=255, blank=True, default="")
    dedupe_key = models.CharField(max_length=255, unique=True)
    signature_valid = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "payment_webhook_events"
        indexes = [
            models.Index(fields=["provider", "reference"]),
            models.Index(fields=["provider", "event_id"]),
            models.Index(fields=["refund_reference"]),
            models.Index(fields=["processed_at"]),
        ]

    def __str__(self):
        return f"WebhookEvent({self.provider}, {self.dedupe_key})"


class OrderEvent(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="events")
    refund = models.ForeignKey(
        Refund,
        on_delete=models.CASCADE,
        related_name="events",
        null=True,
        blank=True,
    )
    actor = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="commerce_order_events",
    )
    event_type = models.CharField(max_length=64)
    message = models.TextField(blank=True, default="")
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "commerce_order_events"
        indexes = [
            models.Index(fields=["order", "created_at"]),
            models.Index(fields=["refund", "created_at"]),
            models.Index(fields=["event_type"]),
        ]

    def __str__(self):
        return f"OrderEvent(order={self.order_id}, type={self.event_type})"
