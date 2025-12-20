import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { router, usePage } from "@inertiajs/react";

const AuthContext = createContext(undefined);

/**
 * AuthProvider - Manages authentication state
 * Integrates with Inertia's shared data for user state
 */
export function AuthProvider({ children }) {
    const { auth } = usePage().props;
    const [user, setUser] = useState(auth?.user || null);

    // Sync user state with Inertia page props
    useEffect(() => {
        if (auth?.user !== undefined) {
            setUser(auth.user);
        }
    }, [auth?.user]);

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

    const value = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
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
