/**
 * Commerce API Service
 * Wraps all /commerce/* JSON endpoints.
 * Uses axios (configured with CSRF in main.jsx) for all requests.
 */
import axios from "axios";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function request(method, url, data = null) {
    try {
        const config = { method, url, headers: JSON_HEADERS };
        if (data && (method === "post" || method === "put" || method === "patch")) {
            config.data = data;
        }
        const response = await axios(config);
        return response.data;
    } catch (error) {
        if (error.response?.data) {
            return error.response.data;
        }
        return { ok: false, error: "network_error", message: error.message };
    }
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export function getCart() {
    return request("get", "/commerce/cart/");
}

export function addToCart(programId) {
    return request("post", "/commerce/cart/items/", { programId });
}

export function removeFromCart(programId) {
    return request("delete", `/commerce/cart/items/${programId}/`);
}

export function clearCart() {
    return request("post", "/commerce/cart/clear/");
}

// ---------------------------------------------------------------------------
// Orders (Student)
// ---------------------------------------------------------------------------

export function getOrders() {
    return request("get", "/commerce/orders/");
}

export function createOrder(paymentMethod) {
    return request("post", "/commerce/orders/", { paymentMethod });
}

export function getOrder(orderId) {
    return request("get", `/commerce/orders/${orderId}/`);
}

export function getOrderStatus(orderId) {
    return request("get", `/commerce/orders/${orderId}/status/`);
}

// ---------------------------------------------------------------------------
// Paystack
// ---------------------------------------------------------------------------

export function initializePaystack(orderId, channels = null) {
    const data = channels ? { channels } : null;
    return request("post", `/commerce/orders/${orderId}/paystack/initialize/`, data);
}

export function chargePaystackMpesa(orderId, phone) {
    return request("post", `/commerce/orders/${orderId}/paystack/charge/mpesa/`, { phone });
}

export function verifyPaystack(orderId, reference) {
    return request("post", `/commerce/orders/${orderId}/paystack/verify/`, { reference });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function getAdminOrders({ status = "", provider = "" } = {}) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (provider) params.set("provider", provider);
    const qs = params.toString();
    return request("get", `/admin/commerce/orders/${qs ? `?${qs}` : ""}`);
}

export function adminMarkPaid(orderId) {
    return request("post", `/admin/commerce/orders/${orderId}/mark-paid/`);
}

export function adminCancelOrder(orderId, reason = "") {
    return request("post", `/admin/commerce/orders/${orderId}/cancel/`, { reason });
}

export function adminRefundOrder(orderId, { orderItemIds = null, reason = "", notes = "" } = {}) {
    return request("post", `/admin/commerce/orders/${orderId}/refund/`, {
        orderItemIds,
        reason,
        notes,
    });
}

export function adminRetryRefund(refundId, { refundAccountDetails = {} } = {}) {
    return request("post", `/admin/commerce/refunds/${refundId}/retry/`, {
        refundAccountDetails,
    });
}

export function getAdminPayouts() {
    return request("get", "/admin/commerce/payouts/");
}

export function createAdminPayout({
    settlementPartyId,
    amountMinor,
    currency = "KES",
    notes = "",
}) {
    return request("post", "/admin/commerce/payouts/", {
        settlementPartyId,
        amountMinor,
        currency,
        notes,
    });
}

export function adminSendPayout(payoutId) {
    return request("post", `/admin/commerce/payouts/${payoutId}/send/`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format amount in minor units to display string.
 * e.g. 150000, "KES" → "KES 1,500"
 */
export function formatAmount(amountMinor, currency = "KES") {
    const major = Number(amountMinor || 0) / 100;
    return `${currency} ${major.toLocaleString()}`;
}

/**
 * Map order status to a user-friendly label.
 */
export const ORDER_STATUS_LABELS = {
    created: "Created",
    pending_payment: "Pending Payment",
    pending_manual_payment: "Awaiting Bank Transfer",
    paid: "Paid",
    failed: "Failed",
    cancelled: "Cancelled",
    expired: "Expired",
    partially_refunded: "Partially Refunded",
    refunded: "Refunded",
};

/**
 * Map order status to MUI chip color.
 */
export const ORDER_STATUS_COLORS = {
    created: "default",
    pending_payment: "warning",
    pending_manual_payment: "info",
    paid: "success",
    failed: "error",
    cancelled: "default",
    expired: "default",
    partially_refunded: "warning",
    refunded: "secondary",
};
