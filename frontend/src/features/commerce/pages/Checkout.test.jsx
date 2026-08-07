import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    refreshCart: vi.fn(),
    checkout: { mode: "cart" },
    getCheckoutPreview: vi.fn(),
}));

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: { visit: vi.fn() },
    usePage: () => ({ props: { checkout: mocks.checkout } }),
}));
vi.mock("@/layouts/DashboardLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));
vi.mock("@/contexts/CartContext", () => ({
    useCart: () => ({
        cart: {
            items: [],
            itemCount: 0,
            totalMinor: 0,
            availablePaymentMethods: [],
        },
        loading: false,
        refreshCart: mocks.refreshCart,
        confirmPrices: vi.fn(),
    }),
}));
vi.mock("@/hooks/useCurrency", () => ({
    useCurrency: () => ({ formatMinorCurrency: (amount) => String(amount) }),
}));
vi.mock("@/features/commerce/components/OfflineInstructions", () => ({
    default: () => null,
}));
vi.mock("@/features/commerce/components/PaymentPending", () => ({
    default: () => null,
}));
vi.mock("@/services/commerceApi", () => ({
    getCheckoutPreview: mocks.getCheckoutPreview,
}));

import Checkout from "./Checkout";

describe("Checkout", () => {
    beforeEach(() => {
        mocks.checkout = { mode: "cart" };
        mocks.refreshCart.mockReset();
        mocks.getCheckoutPreview.mockReset();
    });

    test("renders the generic cart checkout without product-specific data", () => {
        render(<Checkout paystack={{}} />);

        expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
        expect(mocks.refreshCart).toHaveBeenCalled();
    });

    test("uses plain-language payment actions in the professional checkout", async () => {
        mocks.checkout = { mode: "direct", programId: "25" };
        mocks.getCheckoutPreview.mockResolvedValue({
            ok: true,
            mode: "direct",
            items: [
                {
                    id: 1,
                    amountMinor: 500,
                    program: {
                        id: 25,
                        name: "Introduction to the Web & HTML Basics",
                        publicUrl: "/programs/introduction-to-the-web/",
                    },
                },
            ],
            itemCount: 1,
            totalMinor: 500,
            currency: "KES",
            availablePaymentMethods: ["paystack"],
        });

        render(<Checkout paystack={{ publicKey: "pk_test" }} />);

        expect(await screen.findByText("Complete your enrollment")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Pay with M-Pesa" })).toBeInTheDocument();
        expect(screen.queryByText(/STK Push/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("Credit or debit card"));
        expect(screen.getByRole("button", { name: "Pay with card" })).toBeInTheDocument();
    });
});
