import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getOrder: vi.fn(),
    getOrderStatus: vi.fn(),
    initializePaystack: vi.fn(),
    verifyPaystack: vi.fn(),
}));

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));
vi.mock("@/layouts/DashboardLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));
vi.mock("@/hooks/useCurrency", () => ({
    useCurrency: () => ({ formatMinorCurrency: (amount) => `KES ${amount}` }),
}));
vi.mock("@/features/commerce/utils/paystackPopup", () => ({
    resumePaystackTransaction: vi.fn(),
}));
vi.mock("@/features/commerce/components/PaymentPending", () => ({
    default: () => <div>Reconciling payment with Paystack</div>,
}));
vi.mock("@/services/commerceApi", () => ({
    getOrder: mocks.getOrder,
    getOrderStatus: mocks.getOrderStatus,
    initializePaystack: mocks.initializePaystack,
    verifyPaystack: mocks.verifyPaystack,
    ORDER_STATUS_LABELS: { pending_payment: "Pending Payment", paid: "Paid" },
    ORDER_STATUS_COLORS: { pending_payment: "warning", paid: "success" },
}));

import OrderDetail from "./OrderDetail";

const pendingOrder = {
    id: 1,
    reference: "ord-5cf87013db854ff3818a",
    providerReference: "ord-5cf87013db854ff3818a",
    provider: "paystack",
    status: "pending_payment",
    totalMinor: 500,
    refundedMinor: 0,
    items: [{ id: 1, status: "pending", amountMinor: 500, program: { id: 25, name: "Test course" } }],
    refunds: [],
};

describe("OrderDetail pending Paystack reconciliation", () => {
    beforeEach(() => {
        window.history.replaceState({}, "", "/commerce/orders/1/page/");
        mocks.getOrder.mockReset();
        mocks.getOrderStatus.mockReset();
        mocks.initializePaystack.mockReset();
        mocks.verifyPaystack.mockReset();
        mocks.getOrder.mockResolvedValue({ ok: true, order: pendingOrder });
        mocks.verifyPaystack.mockResolvedValue({
            ok: true,
            order: { ...pendingOrder, status: "paid" },
        });
    });

    test("automatically reconciles a pending order without a query flag", async () => {
        render(<OrderDetail orderId={1} paystack={{ publicKey: "pk_test" }} />);

        expect(
            await screen.findByText("Reconciling payment with Paystack"),
        ).toBeInTheDocument();
    });

    test("checks the existing transaction instead of initializing the reference again", async () => {
        render(<OrderDetail orderId={1} paystack={{ publicKey: "pk_test" }} />);

        fireEvent.click(await screen.findByRole("button", { name: "Check Payment Status" }));

        await waitFor(() => {
            expect(mocks.verifyPaystack).toHaveBeenCalledWith(
                1,
                "ord-5cf87013db854ff3818a",
            );
        });
        expect(mocks.initializePaystack).not.toHaveBeenCalled();
    });
});
