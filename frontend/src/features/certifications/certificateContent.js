const STANDARD_SAMPLE_VALUES = {
    student_name: "Alex Morgan",
    student_number: "STU-10482",
    admission_number: "ADM-2026-184",
    examination_number: "KNEC-042781",
    program_title: "Foundations of Professional Practice",
    course_details: "4 lessons, 3 quizzes, 1 assignment",
    course_level: "Professional certificate",
    department: "Business and Leadership",
    campus: "Main campus",
    grade: "Distinction",
    score: "87%",
    progress: "100%",
    course_duration: "40 hours",
    course_start_date: "5 May 2026",
    completion_date: "24 July 2026",
    issue_date: "30 July 2026",
    serial_number: "CERT-2026-00142",
    verification_code: "CERT-2026-00142",
    instructor_name: "Dr Taylor Reed",
    co_instructor_name: "Prof. Casey Okafor",
    principal_name: "Dr Jordan Kamau",
    organization_name: "Learning Academy",
    verification_url: "verify.example/c/CERT-2026-00142",
};

const STRESS_SAMPLE_VALUES = {
    ...STANDARD_SAMPLE_VALUES,
    student_name: "Abdulrahman Mohammed Abdullahi-Wanyonyi",
    student_number: "STUDENT-INTERNATIONAL-2026-10482",
    admission_number: "ADMISSION/PROFESSIONAL/2026/00184",
    examination_number: "NATIONAL-EXAMINATION-042781-KE",
    program_title:
        "Advanced International Professional Certificate in Sustainable Community Leadership",
    course_details: "128 lessons, 24 quizzes, 12 assignments",
    course_level: "Higher Professional Diploma — Niveau supérieur",
    department: "Technology, Engineering and Digital Transformation",
    campus: "München International Learning Campus",
    grade: "Distinction / Compétent avec excellence",
    instructor_name: "Dr Mary-Jane Atieno O’Dwyer",
    co_instructor_name: "Prof. José-María N’Guessan",
    principal_name: "Prof. Christopher Barasa Wanyonyi",
    organization_name:
        "International Academy for Professional and Technical Education",
};

export const CERTIFICATE_SAMPLE_PROFILES = {
    standard: STANDARD_SAMPLE_VALUES,
    stress: STRESS_SAMPLE_VALUES,
};

export function certificateSampleContent(value = "", profile = "standard") {
    const samples =
        CERTIFICATE_SAMPLE_PROFILES[profile] ||
        CERTIFICATE_SAMPLE_PROFILES.standard;
    return Object.entries(samples).reduce(
        (content, [placeholder, sample]) =>
            content.replaceAll(`{{${placeholder}}}`, sample),
        String(value || ""),
    );
}

export function transformCertificateText(value, transform = "none") {
    const text = String(value || "");
    if (transform === "uppercase") return text.toLocaleUpperCase();
    if (transform === "lowercase") return text.toLocaleLowerCase();
    if (transform === "capitalize") {
        return text.replace(
            /(^|[\s–—-])(\p{L})/gu,
            (_, boundary, letter) => `${boundary}${letter.toLocaleUpperCase()}`,
        );
    }
    return text;
}

function characterWidthUnits(character) {
    if (/\s/u.test(character)) return 0.35;
    if (/[ilI1.,'’`|!:;]/u.test(character)) return 0.28;
    if (/[MW@#%&]/u.test(character)) return 0.9;
    if (/[A-Z0-9]/u.test(character)) return 0.67;
    if (character.codePointAt(0) > 0xff) return 1;
    return 0.55;
}

function estimatedLineWidth(text, fontSize, letterSpacing) {
    const characters = Array.from(text);
    const glyphWidth = characters.reduce(
        (total, character) => total + characterWidthUnits(character),
        0,
    );
    return (
        glyphWidth * fontSize +
        Math.max(0, characters.length - 1) * letterSpacing
    );
}

function estimateAtSize({
    text,
    fontSize,
    widthPixels,
    heightPixels,
    lineHeight,
    letterSpacing,
    singleLine,
}) {
    const sourceLines = String(text || "").split("\n");
    const estimatedLines = sourceLines.reduce((total, line) => {
        const lineWidth = estimatedLineWidth(line, fontSize, letterSpacing);
        if (singleLine) return total + 1;
        return total + Math.max(1, Math.ceil(lineWidth / widthPixels));
    }, 0);
    const widestLine = Math.max(
        0,
        ...sourceLines.map((line) =>
            estimatedLineWidth(line, fontSize, letterSpacing),
        ),
    );
    const availableLines = Math.max(
        1,
        Math.floor(heightPixels / Math.max(1, fontSize * lineHeight)),
    );
    const overflowsWidth = singleLine && widestLine > widthPixels;
    const overflowsHeight = estimatedLines > availableLines;

    return {
        estimatedLines,
        availableLines,
        overflows: overflowsWidth || overflowsHeight,
    };
}

export function fitCertificateText({
    text,
    element,
    pageWidthMm = 297,
    pageHeightMm = 210,
}) {
    const styles = element?.styles || {};
    const requestedSize = Number(styles.fontSize) || 16;
    const maximumSize = Math.max(
        6,
        Number(styles.maxFontSize) || requestedSize,
    );
    const startingSize = Math.min(requestedSize, maximumSize);
    const minimumSize = Math.min(
        startingSize,
        Math.max(6, Number(styles.minFontSize) || Math.min(12, startingSize)),
    );
    const autoShrink = styles.autoShrink ?? element?.type === "dynamic_text";
    const lineHeight = Number(styles.lineHeight) || 1.2;
    const letterSpacing = Number(styles.letterSpacing) || 0;
    const singleLine = Boolean(styles.singleLine);
    const referenceWidth = pageWidthMm >= pageHeightMm ? 960 : 620;
    const pixelsPerMm = referenceWidth / Math.max(1, Number(pageWidthMm));
    const widthPixels = Math.max(1, Number(element?.width) * pixelsPerMm);
    const heightPixels = Math.max(1, Number(element?.height) * pixelsPerMm);
    const transformedText = transformCertificateText(
        text,
        styles.textTransform,
    );

    let fontSize = startingSize;
    let estimate = estimateAtSize({
        text: transformedText,
        fontSize,
        widthPixels,
        heightPixels,
        lineHeight,
        letterSpacing,
        singleLine,
    });

    while (autoShrink && estimate.overflows && fontSize > minimumSize) {
        fontSize = Math.max(minimumSize, fontSize - 0.5);
        estimate = estimateAtSize({
            text: transformedText,
            fontSize,
            widthPixels,
            heightPixels,
            lineHeight,
            letterSpacing,
            singleLine,
        });
    }

    return {
        ...estimate,
        fontSize: Number(fontSize.toFixed(2)),
        minimumSize,
        autoShrink,
    };
}
