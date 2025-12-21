import { createContext, useContext, useState, useCallback } from "react";
import { router } from "@inertiajs/react";

const AuthContext = createContext(undefined);

/**
 * AuthProvider - Manages authentication state
 * Receives initial user from props (passed from Inertia page props)
 */
export function AuthProvider({ children, initialUser = null }) {
    const [user, setUser] = useState(initialUser);

    const login = useCallback(async (credentials) => {
        return new Promise((resolve, reject) => {
            router.post("/login", credentials, {
                onSuccess: (page) => {
                    setUser(page.props.auth?.user);
                    resolve(page.props.auth?.user);
                },
                onError: (errors) => reject(errors),
            });
        });
    }, []);

    const logout = useCallback(async () => {
        return new Promise((resolve) => {
            router.post(
                "/logout",
                {},
                {
                    onSuccess: () => {
                        setUser(null);
                        resolve();
                    },
                }
            );
        });
    }, []);

    const refreshUser = useCallback(() => {
        router.reload({ only: ["auth"] });
    }, []);

    const updateUser = useCallback((newUser) => {
        setUser(newUser);
    }, []);

    const value = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

/**
 * useAuth - Access authentication context
 * Must be used within AuthProvider
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
