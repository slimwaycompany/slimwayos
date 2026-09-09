import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export const formatDate = (date: string | Date): string =>
  format(new Date(date), 'd MMMM yyyy', { locale: ru });

export const formatDateShort = (date: string | Date): string =>
  format(new Date(date), 'dd.MM.yyyy');

export const formatRelative = (date: string | Date): string =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });

export const formatWeight = (value: number): string => `${value.toFixed(1)} кг`;

export const formatCalories = (value: number): string => `${Math.round(value)} ккал`;

export const calcBMI = (weightKg: number, heightCm: number): number => {
  const h = heightCm / 100;
  return parseFloat((weightKg / (h * h)).toFixed(1));
};

export const bmiCategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Недовес';
  if (bmi < 25) return 'Норма';
  if (bmi < 30) return 'Избыточный вес';
  return 'Ожирение';
};
