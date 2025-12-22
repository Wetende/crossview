// Dot pattern generator for dynamic backgrounds
export function getBackgroundDots(fill = "#CBD5E1", dotSize = 2, spacing = 20) {
    const encodedFill = fill.replace("#", "%23");
    return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${spacing} ${spacing}"><circle cx="${dotSize}" cy="${dotSize}" r="${dotSize}" fill="${encodedFill}" /></svg>') 0 0/${spacing}px ${spacing}px`;
}
