// API Service Layer
// Base API client for REST/Inertia calls

import { router } from '@inertiajs/react';

/**
 * Generic POST handler using Inertia
 */
export const post = (url, data, options = {}) => {
    return router.post(url, data, {
        preserveScroll: true,
        ...options
    });
};

/**
 * Generic GET handler using Inertia
 */
export const get = (url, options = {}) => {
    return router.get(url, {
        preserveScroll: true,
        ...options
    });
};

export default { post, get };
