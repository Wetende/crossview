import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    refreshCart: vi.fn(),
}));

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: { visit: vi.fn() },
    usePage: () => ({ props: { checkout: { mode: "cart" } } }),
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

import Checkout from "./Checkout";

describe("Checkout", () => {
    test("renders the generic cart checkout without product-specific data", () => {
        render(<Checkout paystack={{}} />);

        expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
        expect(mocks.refreshCart).toHaveBeenCalled();
    });
});
