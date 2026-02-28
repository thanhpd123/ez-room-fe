/** Centralized API base URL for all backend requests */
export const getApiBaseUrl = (): string =>
    (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

export const getApiUrl = (path: string): string => {
    const base = getApiBaseUrl().replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
};
