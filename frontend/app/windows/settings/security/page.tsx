'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, QrCode, Copy, Check, X } from 'lucide-react';
import { API, authHeaders } from '@/lib/auth';

interface MfaStatus { enabled: boolean; factor_id: string | null }
interface EnrollData { factor_id: string; qr_code: string | null; secret: string | null; uri: string | null }

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export default function SecurityPage() {
  const [status,        setStatus]        = useState<MfaStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [showEnroll,    setShowEnroll]    = useState(false);
  const [enrollData,    setEnrollData]    = useState<EnrollData | null>(null);
  const [enrollStep,    setEnrollStep]    = useState<1 | 2>(1);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError,   setEnrollError]   = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  const [verifyCode,    setVerifyCode]    = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError,   setVerifyError]   = useState('');
  const [copied,        setCopied]        = useState(false);

  const [showUnenroll,    setShowUnenroll]    = useState(false);
  const [unenrollLoading, setUnenrollLoading] = useState(false);
  const [unenrollError,   setUnenrollError]   = useState('');

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiFetch<MfaStatus>('/auth/mfa/status');
      setStatus(data);
    } catch {
      setStatus({ enabled: false, factor_id: null });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  const startEnroll = async () => {
    setEnrollLoading(true); setEnrollError('');
    try {
      const data = await apiFetch<EnrollData>('/auth/mfa/enroll', { method: 'POST' });
      setEnrollData(data); setShowEnroll(true); setEnrollStep(1); setEnrollSuccess(false);
    } catch {
      setEnrollError('Не удалось начать настройку 2FA');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode.trim() || !enrollData) return;
    setVerifyLoading(true); setVerifyError('');
    try {
      await apiFetch('/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ factor_id: enrollData.factor_id, code: verifyCode.trim() }),
      });
      setEnrollSuccess(true);
      await loadStatus();
    } catch (e: unknown) {
      const msg = (e as Error).message ?? '';
      setVerifyError(msg.toLowerCase().includes('invalid') ? 'Неверный код. Попробуйте ещё раз.' : 'Ошибка подтверждения.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!status?.factor_id) return;
    setUnenrollLoading(true); setUnenrollError('');
    try {
      await apiFetch('/auth/mfa/unenroll', {
        method: 'POST',
        body: JSON.stringify({ factor_id: status.factor_id }),
      });
      setShowUnenroll(false);
      await loadStatus();
    } catch {
      setUnenrollError('Не удалось отключить 2FA');
    } finally {
      setUnenrollLoading(false);
    }
  };

  const copySecret = () => {
    if (enrollData?.secret) {
      void navigator.clipboard.writeText(enrollData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeEnroll = () => {
    setShowEnroll(false); setEnrollData(null); setEnrollStep(1);
    setVerifyCode(''); setVerifyError(''); setEnrollSuccess(false);
  };

  return (
    <div className="max-w-xl p-6">
      <h2 className="mb-6 text-subheading text-white">Безопасность</h2>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="h-5 w-5 text-teal mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-body font-semibold text-gray-100">Двухфакторная аутентификация (2FA)</p>
            <p className="mt-0.5 text-caption text-gray-500">Google Authenticator / любое TOTP-приложение</p>
          </div>
          {!statusLoading && (
            status?.enabled
              ? <span className="shrink-0 rounded-md bg-green-500/10 border border-green-500/30 px-2 py-0.5 text-caption font-semibold text-green-400">Активна</span>
              : <span className="shrink-0 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-caption text-gray-500">Не настроена</span>
          )}
        </div>

        {statusLoading ? (
          <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
        ) : enrollError ? (
          <p className="mb-3 text-caption text-red-400">{enrollError}</p>
        ) : null}

        {!statusLoading && !status?.enabled && (
          <button
            onClick={() => void startEnroll()}
            disabled={enrollLoading}
            className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <QrCode className="h-4 w-4" />
            {enrollLoading ? 'Подготовка...' : 'Подключить Google Authenticator'}
          </button>
        )}

        {!statusLoading && status?.enabled && (
          <button
            onClick={() => setShowUnenroll(true)}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-body text-red-400 transition-colors hover:bg-red-500/8"
          >
            Отключить 2FA
          </button>
        )}
      </div>

      {/* Enroll modal */}
      {showEnroll && enrollData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="glass w-full max-w-sm rounded-2xl p-7 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-body font-bold text-white">Настройка 2FA</p>
              <button onClick={closeEnroll} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {enrollSuccess ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-body font-bold text-gray-100 mb-2">2FA успешно подключена!</p>
                <p className="text-caption text-gray-400 mb-5">
                  Теперь при входе потребуется код из Google Authenticator.
                </p>
                <button onClick={closeEnroll} className="rounded-xl bg-teal px-6 py-2.5 text-body font-semibold text-gray-950">
                  Готово
                </button>
              </div>
            ) : enrollStep === 1 ? (
              <>
                <p className="mb-5 text-body text-gray-400 leading-relaxed">
                  Откройте <strong className="text-gray-200">Google Authenticator</strong> и отсканируйте QR-код.
                </p>
                {enrollData.qr_code && (
                  <div className="mb-5 flex justify-center">
                    <img
                      src={enrollData.qr_code.startsWith('data:') ? enrollData.qr_code : `data:image/png;base64,${enrollData.qr_code}`}
                      alt="QR code"
                      className="rounded-xl border border-white/10 bg-white p-2"
                      style={{ width: 160, height: 160 }}
                    />
                  </div>
                )}
                {enrollData.secret && (
                  <div className="mb-5">
                    <p className="mb-1.5 text-caption text-gray-500">Или введите ключ вручную</p>
                    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                      <code className="flex-1 text-caption text-gray-300 tracking-widest break-all">
                        {enrollData.secret}
                      </code>
                      <button
                        onClick={copySecret}
                        className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-caption text-gray-400 hover:text-gray-200"
                      >
                        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                        {copied ? 'Скопировано' : 'Копировать'}
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setEnrollStep(2)}
                  className="w-full rounded-xl bg-teal py-2.5 text-body font-semibold text-gray-950"
                >
                  Далее — ввести код
                </button>
              </>
            ) : (
              <>
                <p className="mb-5 text-body text-gray-400 leading-relaxed">
                  Введите 6-значный код из Google Authenticator.
                </p>
                {verifyError && (
                  <div className="mb-3 rounded-xl border border-red-500/25 bg-red-500/8 px-3 py-2 text-caption text-red-400">
                    {verifyError}
                  </div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleVerify(); }}
                  placeholder="000000"
                  autoFocus
                  className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-2xl font-bold tracking-[0.4em] text-gray-100 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleVerify()}
                    disabled={verifyLoading || verifyCode.length !== 6}
                    className="flex-1 rounded-xl bg-teal py-2.5 text-body font-semibold text-gray-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {verifyLoading ? 'Проверка...' : 'Активировать'}
                  </button>
                  <button
                    onClick={() => { setEnrollStep(1); setVerifyCode(''); setVerifyError(''); }}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-body text-gray-400 hover:text-gray-200"
                  >
                    Назад
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Unenroll confirm modal */}
      {showUnenroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="glass w-full max-w-xs rounded-2xl p-7 text-center shadow-2xl">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-body font-bold text-gray-100 mb-2">Отключить 2FA?</p>
            <p className="text-caption text-gray-400 mb-5 leading-relaxed">
              Двухфакторная аутентификация будет отключена. Это снизит безопасность аккаунта.
            </p>
            {unenrollError && (
              <p className="mb-3 text-caption text-red-400">{unenrollError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => void handleUnenroll()}
                disabled={unenrollLoading}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-body font-semibold text-white disabled:opacity-50"
              >
                {unenrollLoading ? 'Отключение...' : 'Отключить'}
              </button>
              <button
                onClick={() => setShowUnenroll(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-body text-gray-400 hover:text-gray-200"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
