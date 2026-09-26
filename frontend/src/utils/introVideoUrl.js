// Mirrors apps/core/intro_video.py so the builder can flag a link the server
// would reject. Both are checked against
// apps/core/tests/fixtures/intro_video_urls.json.
export const INTRO_VIDEO_URL_MAX_LENGTH = 500;
export const INTRO_VIDEO_URL_ERROR =
    "Use a YouTube or Vimeo video link, or a direct HTTPS .mp4 or .webm file.";

const AUTHORITY_RE = /^https?:\/\/([^/?#]*)/i;
const DOMAIN_RE =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9]{1,59})$/;
const IPV4_RE =
    /^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const YOUTUBE_ID = "[A-Za-z0-9_-]{11}";
const YOUTUBE_ID_RE = new RegExp(`^${YOUTUBE_ID}$`);
const YOUTUBE_PATH_RE = new RegExp(`^/(?:shorts|embed)/${YOUTUBE_ID}/?$`);
const YOUTU_BE_PATH_RE = new RegExp(`^/${YOUTUBE_ID}/?$`);
const VIMEO_PATH_RE = /^\/(?:video\/)?\d+(?:\/[A-Za-z0-9_-]+)?\/?$/;
const DIRECT_FILE_RE = /\.(?:mp4|webm)$/i;

function hostMatches(hostname, domain) {
    return hostname === domain || hostname.endsWith(`.${domain}`);
}

function isValidHostname(hostname) {
    return hostname === "localhost" || IPV4_RE.test(hostname) || DOMAIN_RE.test(hostname);
}

export function isSupportedIntroVideoUrl(value) {
    const url = String(value ?? "").trim();
    if (!url || url.length > INTRO_VIDEO_URL_MAX_LENGTH || /[\s\\]/.test(url)) {
        return false;
    }

    // Read the host as typed: URL() quietly normalises hosts the server
    // rejects (for example "0x7f.1" becomes "127.0.0.1").
    const authority = url.match(AUTHORITY_RE)?.[1];
    if (authority === undefined || authority.includes("@")) return false;
    const portMatch = authority.match(/:(\d{1,5})$/);
    if (portMatch && Number(portMatch[1]) > 65535) return false;
    const hostname = (
        portMatch ? authority.slice(0, portMatch.index) : authority
    ).toLowerCase();
    if (!isValidHostname(hostname)) return false;

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return false;
    }

    if (hostMatches(hostname, "youtube.com") || hostMatches(hostname, "youtube-nocookie.com")) {
        if (parsed.pathname === "/watch") {
            return YOUTUBE_ID_RE.test(parsed.searchParams.get("v") || "");
        }
        return YOUTUBE_PATH_RE.test(parsed.pathname);
    }
    if (hostname === "youtu.be") return YOUTU_BE_PATH_RE.test(parsed.pathname);
    if (hostMatches(hostname, "vimeo.com")) return VIMEO_PATH_RE.test(parsed.pathname);

    return (
        parsed.protocol === "https:" &&
        !url.includes("#") &&
        DIRECT_FILE_RE.test(parsed.pathname)
    );
}

// Blank is allowed (no intro video); anything else must be playable.
export function getIntroVideoUrlError(value) {
    const url = String(value ?? "").trim();
    if (!url) return "";
    return isSupportedIntroVideoUrl(url) ? "" : INTRO_VIDEO_URL_ERROR;
}
