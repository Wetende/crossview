import PropTypes from "prop-types";
import { useState, useRef, useEffect, createElement, useMemo } from "react";

// @mui
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";

/***************************  LAZY SECTION WITH SKELETON  ***************************/

export default function LazySection({
    sections,
    fallback,
    offset = "0px",
    placeholderHeight = 400,
    skeleton: CustomSkeleton = null,
}) {
    const sectionList = useMemo(
        () => (Array.isArray(sections) ? sections : [sections]),
        [sections],
    );
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadedComponents, setLoadedComponents] = useState(
        Array(sectionList.length).fill(null),
    );
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                    setIsLoading(true);
                    Promise.all(
                        sectionList.map((section) =>
                            section
                                .importFunc()
                                .then((module) => module.default),
                        ),
                    )
                        .then((components) => {
                            setLoadedComponents(components);
                            setIsLoading(false);
                        })
                        .catch((error) => {
                            console.error("Failed to load section:", error);
                            setIsLoading(false);
                        });
                }
            },
            { rootMargin: offset, threshold: 0.1 },
        );

        if (ref.current) observer.observe(ref.current);

        return () => observer.disconnect();
    }, [sectionList, offset, isVisible]);

    const isLoaded = loadedComponents.every((component) => component);

    // Determine what skeleton to show
    const renderSkeleton = () => {
        if (fallback) return fallback;
        if (CustomSkeleton) return <CustomSkeleton />;
        return (
            <Box
                sx={{
                    height: placeholderHeight,
                    bgcolor: "grey.100",
                    borderRadius: 2,
                }}
            />
        );
    };

    return (
        <Box
            ref={ref}
            sx={{ minHeight: isLoaded ? "auto" : placeholderHeight }}
        >
            {/* Show skeleton while loading */}
            {isVisible && isLoading && (
                <Fade in={isLoading} timeout={300}>
                    <Box>{renderSkeleton()}</Box>
                </Fade>
            )}

            {/* Show loaded content */}
            {isVisible && isLoaded && (
                <Fade in={isLoaded} timeout={500}>
                    <Box>
                        {sectionList.map((section, index) =>
                            createElement(loadedComponents[index], {
                                key: index,
                                ...section.props,
                            }),
                        )}
                    </Box>
                </Fade>
            )}

            {/* Placeholder before section becomes visible */}
            {!isVisible && <Box sx={{ height: placeholderHeight }} />}
        </Box>
    );
}

LazySection.propTypes = {
    sections: PropTypes.oneOfType([PropTypes.array, PropTypes.any]),
    fallback: PropTypes.node,
    skeleton: PropTypes.elementType,
    offset: PropTypes.string,
    placeholderHeight: PropTypes.number,
};
