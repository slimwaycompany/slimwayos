import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Вход' };

export default function LoginPage() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">SlimWay OS</h1>
        <p className="mt-2 text-sm text-gray-500">Войдите в свой аккаунт</p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-gray-500">
        Нет аккаунта?{' '}
        <a href="/register" className="font-medium text-green-600 hover:text-green-500">
          Зарегистрироваться
        </a>
      </p>
    </div>
  );
}
