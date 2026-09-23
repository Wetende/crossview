import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import PaymentPending from "./PaymentPending";
import * as commerceApi from "@/services/commerceApi";

vi.mock("@/services/commerceApi", () => ({
    getOrderStatus: vi.fn(),
    getOrder: vi.fn(),
}));
vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

beforeEach(() => {
    vi.resetAllMocks();
    commerceApi.getOrderStatus.mockResolvedValue({
        ok: true,
        order: { status: "pending_payment" },
    });
});

test("centers the payment verification spinner", async () => {
    render(<PaymentPending orderId={7} />);
    await waitFor(() =>
        expect(commerceApi.getOrderStatus).toHaveBeenCalledWith(7),
    );
    expect(screen.getByRole("progressbar")).toHaveStyle({
        alignSelf: "center",
    });
});

test.each(["failed", "cancelled"])(
    "centers the %s indicator and links to orders",
    async (status) => {
        commerceApi.getOrderStatus.mockResolvedValue({
            ok: true,
            order: { status },
        });
        const { container } = render(<PaymentPending orderId={7} />);
        await screen.findByText("Payment Failed");
        expect(container.querySelector("svg").parentElement).toHaveStyle({
            alignSelf: "center",
        });
        expect(
            screen.getByRole("link", { name: "View Orders" }),
        ).toHaveAttribute("href", "/student/orders/");
    },
);

test("centers the confirmed indicator without changing the paid callback", async () => {
    const order = { id: 7, status: "paid" };
    commerceApi.getOrderStatus.mockResolvedValue({ ok: true, order });
    commerceApi.getOrder.mockResolvedValue({ ok: true, order });
    const onPaid = vi.fn();
    const { container } = render(
        <PaymentPending orderId={7} onPaid={onPaid} />,
    );
    await screen.findByText("Payment Confirmed!");
    expect(container.querySelector("svg").parentElement).toHaveStyle({
        alignSelf: "center",
    });
    expect(onPaid).toHaveBeenCalledWith(order);
});
