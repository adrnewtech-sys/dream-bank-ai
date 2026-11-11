import { useCallback, useEffect, useState } from 'react';
import { fetchUserProfile, type UserProfile } from '@/lib/profile';

export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setProfile(await fetchUserProfile(userId));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your profile.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { profile, isLoading, loadError, retry: load };
}
