import { ConfigProvider } from "@/contexts/ConfigContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeProvider from "@/theme";

/**
 * ProviderWrapper - Root component that composes all context providers
 * Order: ConfigProvider → ThemeProvider → AuthProvider
 *
 * @param {object} initialUser - User data from Inertia page props
 */
export default function ProviderWrapper({ children, initialUser = null }) {
    return (
        <ConfigProvider>
            <ThemeProvider>
                <AuthProvider initialUser={initialUser}>
                    {children}
                </AuthProvider>
            </ThemeProvider>
        </ConfigProvider>
    );
}
