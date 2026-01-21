import { ConfigProvider } from "@/contexts/ConfigContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeProvider from "@/theme";

/**
 * ProviderWrapper - Root component that composes all context providers
 * Order: ConfigProvider → ThemeProvider → AuthProvider
 *
 * @param {object} initialUser - User data from Inertia page props
 * @param {object} platform - Platform branding data
 */
export default function ProviderWrapper({ children, initialUser = null, platform = null }) {
    return (
        <ConfigProvider>
            <ThemeProvider platform={platform}>
                <AuthProvider initialUser={initialUser}>
                    {children}
                </AuthProvider>
            </ThemeProvider>
        </ConfigProvider>
    );
}
