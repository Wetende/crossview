import { forwardRef, useImperativeHandle } from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import VideoRenderer from "./VideoRenderer";

const player = { props: null, element: { currentTime: 0, duration: 0 } };

vi.mock("@/components/LazyReactPlayer", () => ({
    default: forwardRef(function MockPlayer(props, ref) {
        player.props = props;
        useImperativeHandle(ref, () => player.element);
        return <div data-testid="player" />;
    }),
}));

vi.mock("../../api/activityProgressApi", () => ({
    createActivitySessionId: () => "session-1",
    recordActivityProgress: vi.fn(),
}));

const mediaEvent = () => ({ currentTarget: player.element });

const playTo = (seconds) => {
    player.element.currentTime = seconds;
    act(() => player.props.onTimeUpdate(mediaEvent()));
};

describe("VideoRenderer", () => {
    beforeEach(() => {
        player.props = null;
        player.element = { currentTime: 0, duration: 0 };
    });

    it("passes the lesson URL to the player as src", () => {
        const url = "https://www.youtube.com/watch?v=lsMQRaeKNDk";
        render(<VideoRenderer url={url} />);

        expect(player.props.src).toBe(url);
        expect(player.props).not.toHaveProperty("url");
    });

    it("reports the playback position from media time updates", () => {
        const onProgress = vi.fn();
        render(
            <VideoRenderer url="/media/lesson.mp4" onProgress={onProgress} />,
        );

        player.element.duration = 100;
        act(() => player.props.onDurationChange(mediaEvent()));
        playTo(25);

        expect(onProgress).toHaveBeenLastCalledWith({
            played: 0.25,
            playedSeconds: 25,
        });
    });

    it("meets the viewing requirement from continuous playback", () => {
        const onRequirementMet = vi.fn();
        render(
            <VideoRenderer
                url="/media/lesson.mp4"
                requiredProgress={50}
                onRequirementMet={onRequirementMet}
            />,
        );

        player.element.duration = 20;
        act(() => player.props.onDurationChange(mediaEvent()));
        for (let second = 0; second <= 9; second += 1) playTo(second);
        expect(onRequirementMet).not.toHaveBeenCalled();

        playTo(10);
        expect(onRequirementMet).toHaveBeenCalledTimes(1);
    });

    it("does not count a forward seek as watched time", () => {
        const onRequirementMet = vi.fn();
        render(
            <VideoRenderer
                url="/media/lesson.mp4"
                requiredProgress={50}
                onRequirementMet={onRequirementMet}
            />,
        );

        player.element.duration = 100;
        act(() => player.props.onDurationChange(mediaEvent()));
        playTo(0);
        playTo(90);

        expect(onRequirementMet).not.toHaveBeenCalled();
    });

    it("resumes from the saved position once the media metadata loads", () => {
        render(
            <VideoRenderer
                url="/media/lesson.mp4"
                activityProgress={{ resumePositionSeconds: 42 }}
            />,
        );

        act(() => player.props.onLoadedMetadata(mediaEvent()));
        expect(player.element.currentTime).toBe(42);

        player.element.currentTime = 60;
        act(() => player.props.onLoadedMetadata(mediaEvent()));
        expect(player.element.currentTime).toBe(60);
    });

    it("resumes when the media metadata loaded before the player attached", () => {
        player.element = { currentTime: 0, duration: 52, readyState: 1 };
        render(
            <VideoRenderer
                url="/media/lesson.mp4"
                activityProgress={{ resumePositionSeconds: 15 }}
            />,
        );

        expect(player.element.currentTime).toBe(15);
    });
});

describe("VideoRenderer viewing requirement summary", () => {
    beforeEach(() => {
        player.props = null;
        player.element = { currentTime: 0, duration: 0 };
    });

    const renderRequired = (props = {}) =>
        render(
            <VideoRenderer
                url="/media/lesson.mp4"
                requiredProgress={90}
                {...props}
            />,
        );

    const loadDuration = (seconds) => {
        player.element.duration = seconds;
        act(() => player.props.onDurationChange(mediaEvent()));
    };

    it("shows only the watched and required percentages", () => {
        renderRequired();
        loadDuration(100);
        for (let second = 0; second <= 22; second += 1) playTo(second);

        expect(screen.getByText("22% watched")).toBeInTheDocument();
        expect(screen.getByText("Watch 90% to complete")).toBeInTheDocument();
        expect(screen.queryByText(/seeked/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/don't count/i)).not.toBeInTheDocument();
        expect(
            screen.getByRole("progressbar", { name: "22% of video watched" }),
        ).toBeInTheDocument();
    });

    it("explains that skipped parts do not count after a jump ahead", () => {
        renderRequired();
        loadDuration(100);
        act(() => player.props.onPlay());
        playTo(0);
        playTo(60);

        expect(
            screen.getByText("Skipped parts don't count toward the 90%."),
        ).toBeInTheDocument();
    });

    it("does not treat resuming a saved position as skipping", () => {
        renderRequired({ activityProgress: { resumePositionSeconds: 40 } });
        loadDuration(100);
        playTo(0);
        playTo(40);
        act(() => player.props.onPlay());
        playTo(41);

        expect(screen.queryByText(/don't count/i)).not.toBeInTheDocument();
    });

    it("shows a completed lesson as complete", () => {
        renderRequired({
            enrollmentId: 22,
            nodeId: 146,
            activityProgress: { progressPercent: 100, isCompleted: true },
        });

        expect(
            screen.getByText("Watched: lesson complete"),
        ).toBeInTheDocument();
        expect(screen.queryByText(/to complete/)).not.toBeInTheDocument();
    });
});
