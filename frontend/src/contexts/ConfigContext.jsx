import { createContext, useContext, useCallback } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { defaultConfig } from "@/config";

const ConfigContext = createContext(undefined);

/**
 * ConfigProvider - Manages application configuration state
 * Persists user preferences to localStorage
 */
export function ConfigProvider({ children }) {
    const [config, setConfig] = useLocalStorage(
        "crossview-lms-config",
        defaultConfig
    );

    const updateConfig = useCallback(
        (updates) => {
            setConfig((prev) => ({ ...prev, ...updates }));
        },
        [setConfig]
    );

    const toggleSidebar = useCallback(() => {
        setConfig((prev) => ({
            ...prev,
            sidebarCollapsed: !prev.sidebarCollapsed,
        }));
    }, [setConfig]);

    const setBlueprint = useCallback(
        (blueprintId) => {
            setConfig((prev) => ({ ...prev, blueprintId }));
        },
        [setConfig]
    );

    const setThemeMode = useCallback(
        (themeMode) => {
            setConfig((prev) => ({ ...prev, themeMode }));
        },
        [setConfig]
    );

    const value = {
        ...config,
        updateConfig,
        toggleSidebar,
        setBlueprint,
        setThemeMode,
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
}

/**
 * useConfig - Access configuration context
 * Must be used within ConfigProvider
 */
export function useConfig() {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error("useConfig must be used within ConfigProvider");
    }
    return context;
}
