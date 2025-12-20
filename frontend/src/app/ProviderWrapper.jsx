import { useState, useEffect } from "react";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeProvider from "@/theme";
import Loader from "@/components/Loader";

/**
 * ProviderWrapper - Root component that composes all context providers
 * Order: ConfigProvider → ThemeProvider → AuthProvider
 */
export default function ProviderWrapper({ children }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Brief loading state for initial configuration
        const timer = setTimeout(() => setLoading(false), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <ConfigProvider>
            <ThemeProvider>
                <AuthProvider>
                    <main>
                        {loading ? (
                            <Loader fullScreen message="Loading..." />
                        ) : (
                            children
                        )}
                    </main>
                </AuthProvider>
            </ThemeProvider>
        </ConfigProvider>
    );
}
