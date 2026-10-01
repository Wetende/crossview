import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import VideoBlock from "./VideoBlock";

const player = { props: null };

vi.mock("@/components/LazyReactPlayer", () => ({
    default: (props) => {
        player.props = props;
        return <div data-testid="player" />;
    },
}));

describe("VideoBlock", () => {
    it("passes the block URL to the player as src", () => {
        const url = "https://vimeo.com/76979871";
        render(<VideoBlock data={{ url }} />);

        expect(player.props.src).toBe(url);
        expect(player.props).not.toHaveProperty("url");
    });
});
