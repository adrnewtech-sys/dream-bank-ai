import { supabase } from '@/lib/supabase';

export interface UserProfile {
  fullName: string;
  createdAt: string;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Your profile could not be found. Please try again.');
  return { fullName: data.full_name, createdAt: data.created_at };
}

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  return initials || '?';
}
