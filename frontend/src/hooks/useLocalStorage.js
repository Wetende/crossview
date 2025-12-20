import { useState, useEffect, useCallback } from "react";

/**
 * useLocalStorage - Persist state to localStorage
 * Handles SSR and localStorage unavailability gracefully
 */
export default function useLocalStorage(key, defaultValue) {
    // Initialize state with value from localStorage or default
    const [value, setValue] = useState(() => {
        if (typeof window === "undefined") {
            return defaultValue;
        }

        try {
            const stored = window.localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    // Update localStorage when value changes
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, value]);

    // Memoized setter to prevent unnecessary re-renders
    const setStoredValue = useCallback((newValue) => {
        setValue((prevValue) => {
            const valueToStore =
                typeof newValue === "function" ? newValue(prevValue) : newValue;
            return valueToStore;
        });
    }, []);

    return [value, setStoredValue];
}
