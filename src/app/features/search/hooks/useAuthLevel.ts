import { useState, useEffect, useCallback } from 'react';
import { fetchAuthMe, getAccessToken } from '@/lib/api';

export type SearchLevel = 'guest' | 'tenant' | 'vip';

export interface AuthLevelState {
    level: SearchLevel;
    isGuest: boolean;
    isTenant: boolean;
    isVip: boolean;
    loading: boolean;
    refetch: () => Promise<void>;
}

export function useAuthLevel(): AuthLevelState {
    const [level, setLevel] = useState<SearchLevel>('guest');
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        const token = await getAccessToken();
        if (!token) {
            setLevel('guest');
            setLoading(false);
            return;
        }
        try {
            const res = await fetchAuthMe();
            const user = res?.user;
            if (!user) {
                setLevel('guest');
                return;
            }
            if (user.isVip === true) {
                setLevel('vip');
            } else if (user.role === 'TENANT' || user.role === 'LANDLORD' || user.role === 'ADMIN' || user.role === 'MODERATOR') {
                setLevel('tenant');
            } else {
                setLevel('guest');
            }
        } catch {
            setLevel('guest');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        level,
        isGuest: level === 'guest',
        isTenant: level === 'tenant',
        isVip: level === 'vip',
        loading,
        refetch,
    };
}
