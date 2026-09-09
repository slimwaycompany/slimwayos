'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface WindowHeaderProps {
  title: string;
}

export default function WindowHeader({ title }: WindowHeaderProps) {
  const router = useRouter();
  return (
    <>
      <header className="flex items-center justify-between bg-gray-900 px-6 py-4">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <button
          onClick={() => router.push('/hub')}
          aria-label="Закрыть окно"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      <hr className="border-gray-800" />
    </>
  );
}
