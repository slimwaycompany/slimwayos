import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Вход — SlimWay OS' };

export default function LoginPage() {
  return (
    <div className="glass rounded-2xl p-8">
      <div className="mb-8 text-center">
        <h1 className="text-heading">
          <span style={{ color: '#02BDB6' }}>SlimWay</span>
          <span style={{ color: '#263CD9' }}>OS</span>
        </h1>
        <p className="mt-2 text-body text-gray-400">Войдите в свой аккаунт</p>
      </div>
      <LoginForm />
    </div>
  );
}
