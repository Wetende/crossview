import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import * as commerceApi from "@/services/commerceApi";

const WISHLIST_KEY = "wishlist_programs";
const WishlistContext = createContext(undefined);

function normalizeIds(programIds) {
    if (!Array.isArray(programIds)) {
        return [];
    }
    const seen = new Set();
    const normalized = [];
    for (const rawId of programIds) {
        const parsed = Number(rawId);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            continue;
        }
        const id = Math.trunc(parsed);
        if (seen.has(id)) {
            continue;
        }
        seen.add(id);
        normalized.push(id);
    }
    return normalized;
}

function readGuestWishlist() {
    try {
        return normalizeIds(JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"));
    } catch {
        return [];
    }
}

function writeGuestWishlist(ids) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(normalizeIds(ids)));
}

export function WishlistProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [wishlist, setWishlist] = useState({ items: [], itemCount: 0 });
    const [loading, setLoading] = useState(false);

    const refreshWishlist = useCallback(async () => {
        if (isAuthenticated) {
            setLoading(true);
            try {
                const res = await commerceApi.getWishlist();
                if (res.ok && res.wishlist) {
                    setWishlist(res.wishlist);
                }
            } finally {
                setLoading(false);
            }
            return;
        }

        const guestIds = readGuestWishlist();
        setWishlist({
            items: guestIds.map((programId) => ({
                id: `guest-${programId}`,
                program: { id: programId },
            })),
            itemCount: guestIds.length,
        });
    }, [isAuthenticated]);

    const addToWishlist = useCallback(
        async (programId) => {
            const parsedId = Number(programId);
            if (!Number.isFinite(parsedId) || parsedId <= 0) {
                return { ok: false, error: "invalid_program_id", message: "Invalid program." };
            }
            const normalizedId = Math.trunc(parsedId);

            if (isAuthenticated) {
                const res = await commerceApi.addToWishlist(normalizedId);
                if (res.ok && res.wishlist) {
                    setWishlist(res.wishlist);
                }
                return res;
            }

            const ids = readGuestWishlist();
            if (!ids.includes(normalizedId)) {
                ids.push(normalizedId);
                writeGuestWishlist(ids);
            }
            setWishlist({
                items: ids.map((id) => ({ id: `guest-${id}`, program: { id } })),
                itemCount: ids.length,
            });
            return { ok: true, wishlist: { itemCount: ids.length } };
        },
        [isAuthenticated],
    );

    const removeFromWishlist = useCallback(
        async (programId) => {
            const parsedId = Number(programId);
            if (!Number.isFinite(parsedId) || parsedId <= 0) {
                return { ok: false, error: "invalid_program_id", message: "Invalid program." };
            }
            const normalizedId = Math.trunc(parsedId);

            if (isAuthenticated) {
                const res = await commerceApi.removeFromWishlist(normalizedId);
                if (res.ok && res.wishlist) {
                    setWishlist(res.wishlist);
                }
                return res;
            }

            const ids = readGuestWishlist().filter((id) => id !== normalizedId);
            writeGuestWishlist(ids);
            setWishlist({
                items: ids.map((id) => ({ id: `guest-${id}`, program: { id } })),
                itemCount: ids.length,
            });
            return { ok: true, wishlist: { itemCount: ids.length } };
        },
        [isAuthenticated],
    );

    const syncGuestWishlist = useCallback(async () => {
        if (!isAuthenticated) {
            return { ok: false, error: "not_authenticated" };
        }
        const guestIds = readGuestWishlist();
        if (guestIds.length === 0) {
            return { ok: true, mergedCount: 0 };
        }
        const res = await commerceApi.syncWishlist(guestIds);
        if (res.ok) {
            localStorage.removeItem(WISHLIST_KEY);
            if (res.wishlist) {
                setWishlist(res.wishlist);
            }
        }
        return res;
    }, [isAuthenticated]);

    useEffect(() => {
        refreshWishlist();
    }, [refreshWishlist]);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        const guestIds = readGuestWishlist();
        if (guestIds.length === 0) {
            return;
        }
        syncGuestWishlist();
    }, [isAuthenticated, syncGuestWishlist]);

    const value = useMemo(
        () => ({
            wishlist,
            wishlistCount: wishlist?.itemCount || 0,
            loading,
            refreshWishlist,
            addToWishlist,
            removeFromWishlist,
            syncGuestWishlist,
        }),
        [wishlist, loading, refreshWishlist, addToWishlist, removeFromWishlist, syncGuestWishlist],
    );

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error("useWishlist must be used within WishlistProvider");
    }
    return context;
}
