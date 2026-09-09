'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { setSession, API } from '@/lib/auth';

const schema = z.object({
  email:    z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});
type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? 'Ошибка входа');

      setSession(body.session.access_token, {
        is_developer:        body.is_developer,
        must_change_password: body.must_change_password,
      });

      router.push(body.must_change_password ? '/login/change-password' : '/hub');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-caption text-gray-400 mb-1">Email</label>
        <input
          type="email"
          autoComplete="email"
          className="w-full glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none placeholder-gray-600"
          placeholder="you@example.com"
          {...register('email')}
        />
        {errors.email && <p className="mt-1 text-caption text-red-400">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-caption text-gray-400 mb-1">Пароль</label>
        <input
          type="password"
          autoComplete="current-password"
          className="w-full glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none placeholder-gray-600"
          placeholder="••••••••"
          {...register('password')}
        />
        {errors.password && <p className="mt-1 text-caption text-red-400">{errors.password.message}</p>}
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
        {isSubmitting ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
}
