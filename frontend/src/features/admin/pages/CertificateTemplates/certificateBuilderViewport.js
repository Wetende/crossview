export const BUILDER_ZOOM = Object.freeze({
    min: 0.35,
    max: 3,
    step: 0.1,
    initial: 0.82,
});

export const clampBuilderZoom = (value) =>
    Math.min(
        BUILDER_ZOOM.max,
        Math.max(BUILDER_ZOOM.min, Number(value) || BUILDER_ZOOM.initial),
    );

export const stepBuilderZoom = (value, direction) =>
    clampBuilderZoom(
        Number((value + BUILDER_ZOOM.step * direction).toFixed(2)),
    );

export const fitBuilderZoom = ({
    viewportWidth,
    viewportHeight,
    canvasWidth,
    canvasHeight,
    padding = 64,
}) => {
    const availableWidth = Math.max(1, viewportWidth - padding);
    const availableHeight = Math.max(1, viewportHeight - padding);
    return clampBuilderZoom(
        Math.min(availableWidth / canvasWidth, availableHeight / canvasHeight),
    );
};
