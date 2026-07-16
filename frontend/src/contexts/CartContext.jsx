/**
 * CartContext — Global cart state provider
 * Provides cart data and mutation helpers app-wide.
 * Only fetches when user is authenticated.
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import * as commerceApi from "@/services/commerceApi";

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);

    const cartCount = cart?.itemCount || 0;

    const refreshCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCart(null);
            return;
        }
        setLoading(true);
        try {
            const res = await commerceApi.getCart();
            if (res.ok) {
                setCart(res.cart);
            }
        } catch {
            // Silently fail — cart badge just stays at 0
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const addToCart = useCallback(async (programId) => {
        const res = await commerceApi.addToCart(programId);
        if (res.ok) {
            setCart(res.cart);
        }
        return res;
    }, []);

    const removeFromCart = useCallback(async (programId) => {
        const res = await commerceApi.removeFromCart(programId);
        if (res.ok) {
            setCart(res.cart);
        }
        return res;
    }, []);

    const clearCartAction = useCallback(async () => {
        const res = await commerceApi.clearCart();
        if (res.ok) {
            setCart(res.cart);
        }
        return res;
    }, []);

    const confirmPrices = useCallback(async () => {
        const res = await commerceApi.confirmCartPrices();
        if (res.ok) {
            setCart(res.cart);
        }
        return res;
    }, []);

    // Reset cart on logout, fetch on login
    useEffect(() => {
        if (isAuthenticated) {
            refreshCart();
        } else {
            setCart(null);
        }
    }, [isAuthenticated, refreshCart]);

    const value = {
        cart,
        cartCount,
        loading,
        refreshCart,
        addToCart,
        removeFromCart,
        clearCart: clearCartAction,
        confirmPrices,
    };

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
}

/**
 * useCart — Access cart context.
 * Must be used within CartProvider (which is inside AuthProvider).
 */
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}
