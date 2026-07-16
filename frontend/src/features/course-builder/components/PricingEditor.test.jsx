import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { PricingEditor } from "./SettingsEditors";

describe("PricingEditor", () => {
    test("edits scheduled sale dates and learner-facing price information", () => {
        const onChange = vi.fn();
        render(
            <PricingEditor
                data={{
                    price: 80,
                    original_price: 100,
                    payment_collection: "online",
                    sale_starts_at: "2026-07-10T00:00:00Z",
                    sale_ends_at: "2026-07-17T00:00:00Z",
                    price_info: "Includes materials",
                }}
                onChange={onChange}
                recommendation={{ online_payment_supported: true }}
                recommendations={{}}
                platformFeatures={{ payments: true }}
                platformTimezone="UTC"
            />,
        );

        expect(screen.getByLabelText("Sale/current price (KES)")).toHaveValue(80);
        expect(screen.getByLabelText("Regular price (KES)")).toHaveValue(100);
        expect(screen.getByLabelText("Sale starts")).toHaveValue("2026-07-10T00:00");

        fireEvent.change(screen.getByLabelText("Price information"), {
            target: { value: "Includes certificate" },
        });

        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ price_info: "Includes certificate" }),
        );
    });
});
