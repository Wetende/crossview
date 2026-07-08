export const RICH_TEXT_IMAGE_MAX_WIDTH = "720px";

export const richTextImageSx = {
    display: "block",
    width: "auto",
    maxWidth: `min(100%, ${RICH_TEXT_IMAGE_MAX_WIDTH})`,
    height: "auto",
    mx: "auto",
};

export const isImageFile = (file) =>
    Boolean(file?.type && file.type.startsWith("image/"));

export const getImageFilesFromClipboard = (clipboardData) => {
    if (!clipboardData) {
        return [];
    }

    const files = Array.from(clipboardData.files || []).filter(isImageFile);
    if (files.length > 0) {
        return files;
    }

    return Array.from(clipboardData.items || [])
        .filter(
            (item) =>
                item?.kind === "file" &&
                item.type &&
                item.type.startsWith("image/"),
        )
        .map((item) => item.getAsFile?.())
        .filter(isImageFile);
};

export const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
                return;
            }

            reject(new Error("Could not read image data."));
        };
        reader.onerror = () => {
            reject(reader.error || new Error("Could not read image data."));
        };
        reader.readAsDataURL(file);
    });

export const getUploadedImageUrl = (data) => {
    if (!data || typeof data !== "object") {
        return "";
    }

    return data.image?.url || data.file?.url || data.url || data.src || "";
};
