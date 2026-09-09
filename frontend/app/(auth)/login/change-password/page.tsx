'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { authHeaders, setSession, getUser, API } from '@/lib/auth';
import type { Metadata } from 'next';

const schema = z
  .object({
    new_password:     z.string().min(6, 'Минимум 6 символов'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Пароли не совпадают',
    path: ['confirm_password'],
  });
type FormData = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ new_password: data.new_password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? 'Ошибка смены пароля');

      // Update stored user to reflect password changed
      const user = getUser();
      if (user) setSession(localStorage.getItem('slimway_token')!, { ...user, must_change_password: false });

      router.push('/hub');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка смены пароля');
    }
  };

  return (
    <div className="glass rounded-2xl p-8">
      <div className="mb-8 text-center">
        <h1 className="text-heading">
          <span style={{ color: '#02BDB6' }}>SlimWay</span>
          <span style={{ color: '#263CD9' }}>OS</span>
        </h1>
        <p className="mt-2 text-body text-gray-300 font-medium">Смена пароля</p>
        <p className="mt-1 text-caption text-gray-500">
          Это первый вход. Установите постоянный пароль.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-caption text-gray-400 mb-1">Новый пароль</label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none placeholder-gray-600"
            placeholder="Минимум 6 символов"
            {...register('new_password')}
          />
          {errors.new_password && (
            <p className="mt-1 text-caption text-red-400">{errors.new_password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-caption text-gray-400 mb-1">Повторите пароль</label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none placeholder-gray-600"
            placeholder="••••••••"
            {...register('confirm_password')}
          />
          {errors.confirm_password && (
            <p className="mt-1 text-caption text-red-400">{errors.confirm_password.message}</p>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-body text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-teal py-2.5 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80 disabled:opacity-50 mt-2"
        >
          {isSubmitting ? 'Сохранение...' : 'Сохранить пароль'}
        </button>
      </form>
    </div>
  );
}
