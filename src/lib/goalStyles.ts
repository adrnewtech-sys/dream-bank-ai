import { Briefcase, Car, GraduationCap, Heart, Home, Laptop, Plane, Shield, Target, Umbrella, type LucideIcon } from 'lucide-react';
import type { GoalColor } from '@/types';

interface ColorStyle {
  label: string;
  bar: string;
  soft: string;
  text: string;
  swatch: string;
  hex: string;
}

export const GOAL_COLORS: Record<GoalColor, ColorStyle> = {
  blue: { label: 'Blue', bar: 'from-blue-500 to-sky-400', soft: 'bg-blue-50', text: 'text-blue-700', swatch: 'bg-blue-500', hex: '#3b82f6' },
  green: { label: 'Green', bar: 'from-emerald-500 to-green-400', soft: 'bg-emerald-50', text: 'text-emerald-700', swatch: 'bg-emerald-500', hex: '#10b981' },
  teal: { label: 'Teal', bar: 'from-teal-500 to-cyan-400', soft: 'bg-teal-50', text: 'text-teal-700', swatch: 'bg-teal-500', hex: '#14b8a6' },
  sky: { label: 'Sky', bar: 'from-sky-500 to-indigo-300', soft: 'bg-sky-50', text: 'text-sky-700', swatch: 'bg-sky-500', hex: '#0ea5e9' },
  amber: { label: 'Amber', bar: 'from-amber-500 to-yellow-400', soft: 'bg-amber-50', text: 'text-amber-700', swatch: 'bg-amber-500', hex: '#f59e0b' },
};

export const GOAL_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  target: { label: 'Target', Icon: Target },
  home: { label: 'Home', Icon: Home },
  car: { label: 'Car', Icon: Car },
  plane: { label: 'Travel', Icon: Plane },
  graduation: { label: 'Education', Icon: GraduationCap },
  heart: { label: 'Family', Icon: Heart },
  laptop: { label: 'Tech', Icon: Laptop },
  shield: { label: 'Safety net', Icon: Shield },
  briefcase: { label: 'Business', Icon: Briefcase },
  umbrella: { label: 'Rainy day', Icon: Umbrella },
};

export const GOAL_COLOR_KEYS = Object.keys(GOAL_COLORS) as GoalColor[];

export function getGoalIcon(key: string): LucideIcon {
  return GOAL_ICONS[key]?.Icon ?? Target;
}
