import { useAuth } from '@/app/context/useAuth';

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
    const { user, isLoading, refreshUser } = useAuth();

    const isGuest = !user;
    const isVip = user?.isVip === true;
    const isTenant =
        !!user &&
        !isVip &&
        (user.role === 'TENANT' || user.role === 'LANDLORD' || user.role === 'ADMIN' || user.role === 'MODERATOR');
    const level: SearchLevel = isVip ? 'vip' : isTenant ? 'tenant' : 'guest';

    return {
        level,
        isGuest,
        isTenant,
        isVip,
        loading: isLoading,
        refetch: refreshUser,
    };
}
