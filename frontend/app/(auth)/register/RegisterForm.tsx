'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Минимум 2 символа'),
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type RegisterData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterData) => {
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Ошибка регистрации');
      }
      router.push('/hub');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    }
  };

  const fields = [
    { name: 'name' as const, label: 'Имя', type: 'text', autoComplete: 'name' },
    { name: 'email' as const, label: 'Email', type: 'email', autoComplete: 'email' },
    { name: 'password' as const, label: 'Пароль', type: 'password', autoComplete: 'new-password' },
    { name: 'confirmPassword' as const, label: 'Повторите пароль', type: 'password', autoComplete: 'new-password' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {fields.map((f) => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-gray-700">{f.label}</label>
          <input
            type={f.type}
            autoComplete={f.autoComplete}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            {...register(f.name)}
          />
          {errors[f.name] && (
            <p className="mt-1 text-xs text-red-500">{errors[f.name]?.message}</p>
          )}
        </div>
      ))}

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
