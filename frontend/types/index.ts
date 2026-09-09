export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'coach';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  heightCm?: number;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  targetWeightKg?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface WeightRecord {
  id: string;
  userId: string;
  weightKg: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface NutritionLog {
  id: string;
  userId: string;
  date: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  meals: Meal[];
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  time: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
