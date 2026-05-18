import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { router } from "@inertiajs/react";
import { Badge, IconButton, Tooltip } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";

const POLL_INTERVAL_MS = 60_000;
const COUNT_CACHE_KEY = "lms.messages.unread_count";
const COUNT_CACHE_TTL_MS = 60_000;

function loadCachedUnreadCount() {
    try {
        const raw = window.sessionStorage.getItem(COUNT_CACHE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        if (
            typeof parsed?.count !== "number" ||
            typeof parsed?.fetchedAt !== "number"
        ) {
            return null;
        }
        if (Date.now() - parsed.fetchedAt > COUNT_CACHE_TTL_MS) {
            return null;
        }
        return parsed.count;
    } catch {
        return null;
    }
}

function persistUnreadCount(count) {
    try {
        window.sessionStorage.setItem(
            COUNT_CACHE_KEY,
            JSON.stringify({ count, fetchedAt: Date.now() }),
        );
    } catch {
        // Ignore cache failures.
    }
}

export default function MessageUnreadBadge() {
    const [unreadCount, setUnreadCount] = useState(() => {
        if (typeof window === "undefined") {
            return 0;
        }
        return loadCachedUnreadCount() ?? 0;
    });

    const syncUnreadCount = useCallback(async () => {
        const response = await axios.get("/api/messages/unread-count/");
        const nextCount = Number(response.data?.count || 0);
        setUnreadCount(nextCount);
        persistUnreadCount(nextCount);
        return nextCount;
    }, []);

    useEffect(() => {
        let cancelled = false;

        const maybeFetchCount = async () => {
            const cachedCount =
                typeof window !== "undefined" ? loadCachedUnreadCount() : null;
            if (cachedCount !== null) {
                setUnreadCount(cachedCount);
                return;
            }

            try {
                const nextCount = await syncUnreadCount();
                if (!cancelled) {
                    setUnreadCount(nextCount);
                }
            } catch {
                if (!cancelled) {
                    setUnreadCount((current) => current);
                }
            }
        };

        maybeFetchCount();

        return () => {
            cancelled = true;
        };
    }, [syncUnreadCount]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                syncUnreadCount().catch(() => {
                    // Ignore transient polling failures.
                });
            }
        }, POLL_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [syncUnreadCount]);

    return (
        <Tooltip title="Messages">
            <IconButton
                onClick={() => router.visit("/messages/")}
                sx={{ color: "text.secondary" }}
                aria-label="messages"
            >
                <Badge badgeContent={unreadCount} color="error" max={99}>
                    <MailOutlineIcon />
                </Badge>
            </IconButton>
        </Tooltip>
    );
}
