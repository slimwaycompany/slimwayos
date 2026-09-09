import type { Metadata } from 'next';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = { title: 'Регистрация' };

export default function RegisterPage() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">SlimWay OS</h1>
        <p className="mt-2 text-sm text-gray-500">Создайте аккаунт</p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <a href="/login" className="font-medium text-green-600 hover:text-green-500">
          Войти
        </a>
      </p>
    </div>
  );
}
