import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    confirmPrices: vi.fn(),
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
}));
vi.mock("@/layouts/DashboardLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));
vi.mock("@/hooks/useCurrency", () => ({
    useCurrency: () => ({
        formatMinorCurrency: (amount) => `KES ${Number(amount || 0) / 100}`,
    }),
}));
vi.mock("@/contexts/CartContext", () => ({
    useCart: () => ({
        cart: {
            id: 1,
            itemCount: 1,
            totalMinor: 125000,
            requiresPriceConfirmation: true,
            pricingError: "",
            items: [
                {
                    id: 1,
                    amountMinor: 125000,
                    previousAmountMinor: 100000,
                    priceChanged: true,
                    program: {
                        id: 7,
                        name: "Portable course",
                        code: "COURSE-7",
                        publicUrl: "/programs/portable-course/",
                    },
                },
            ],
        },
        loading: false,
        removeFromCart: vi.fn(),
        clearCart: vi.fn(),
        refreshCart: mocks.refreshCart,
        confirmPrices: mocks.confirmPrices,
    }),
}));

import Cart from "./Cart";

describe("Cart price confirmation", () => {
    beforeEach(() => {
        mocks.confirmPrices.mockReset();
        mocks.refreshCart.mockReset();
        mocks.confirmPrices.mockResolvedValue({ ok: true });
    });

    test("shows changed prices and blocks checkout until confirmation", async () => {
        render(<Cart />);

        expect(
            screen.getByText(/course prices changed/i),
        ).toBeInTheDocument();
        expect(screen.getByText("KES 1000")).toHaveStyle({
            textDecoration: "line-through",
        });
        expect(screen.getByRole("button", { name: /proceed to checkout/i })).toBeDisabled();

        fireEvent.click(screen.getByRole("button", { name: /confirm prices/i }));

        await waitFor(() => expect(mocks.confirmPrices).toHaveBeenCalledTimes(1));
    });
});
