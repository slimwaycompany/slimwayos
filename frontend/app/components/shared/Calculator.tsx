'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CalculatorProps {
  onClose: () => void;
}

function calculate(a: number, b: number, op: string): number {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '×') return a * b;
  if (op === '÷') return b !== 0 ? a / b : 0;
  return b;
}

const BTN_ROWS: { l: string; type?: string; wide?: boolean }[][] = [
  [{ l: 'C', type: 'clear' }, { l: '+/-', type: 'fn' }, { l: '%', type: 'fn' }, { l: '÷', type: 'op' }],
  [{ l: '7' }, { l: '8' }, { l: '9' }, { l: '×', type: 'op' }],
  [{ l: '4' }, { l: '5' }, { l: '6' }, { l: '-', type: 'op' }],
  [{ l: '1' }, { l: '2' }, { l: '3' }, { l: '+', type: 'op' }],
  [{ l: '0', wide: true }, { l: '.' }, { l: '=', type: 'eq' }],
];

export default function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay]     = useState('0');
  const [prev, setPrev]           = useState<number | null>(null);
  const [op, setOp]               = useState<string | null>(null);
  const [reset, setReset]         = useState(false);
  const [history, setHistory]     = useState<string[]>([]);
  const [expression, setExpression] = useState('');

  const handleNum = (n: string) => {
    if (reset) { setDisplay(n); setReset(false); }
    else setDisplay(display === '0' ? n : display.length < 15 ? display + n : display);
  };
  const handleDot = () => {
    if (reset) { setDisplay('0.'); setReset(false); return; }
    if (!display.includes('.')) setDisplay(display + '.');
  };
  const handleOp = (o: string) => {
    const val = parseFloat(display);
    if (prev !== null && op && !reset) {
      const result = calculate(prev, val, op);
      setDisplay(String(result));
      setPrev(result);
      setExpression(`${result} ${o}`);
    } else {
      setPrev(val);
      setExpression(`${display} ${o}`);
    }
    setOp(o); setReset(true);
  };
  const handleEquals = () => {
    if (prev === null || op === null) return;
    const val = parseFloat(display);
    const result = calculate(prev, val, op);
    const expr = `${expression} ${display} = ${result}`;
    setHistory(h => [expr, ...h.slice(0, 9)]);
    setDisplay(String(result));
    setPrev(null); setOp(null); setReset(true); setExpression('');
  };
  const handleClear = () => { setDisplay('0'); setPrev(null); setOp(null); setReset(false); setExpression(''); };
  const handleBack  = () => {
    if (reset || display.length === 1) { setDisplay('0'); setReset(false); }
    else setDisplay(display.slice(0, -1) || '0');
  };
  const handleSign = () => setDisplay(String(-parseFloat(display)));
  const handlePct  = () => setDisplay(String(parseFloat(display) / 100));

  const handleBtn = (b: { l: string; type?: string }) => {
    if (b.l === 'C')  handleClear();
    else if (b.l === '+/-') handleSign();
    else if (b.l === '%')   handlePct();
    else if (b.l === '=')   handleEquals();
    else if (['+', '-', '×', '÷'].includes(b.l)) handleOp(b.l);
    else if (b.l === '.')   handleDot();
    else handleNum(b.l);
  };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleNum(e.key);
      else if (e.key === '.') handleDot();
      else if (e.key === '+') handleOp('+');
      else if (e.key === '-') handleOp('-');
      else if (e.key === '*') handleOp('×');
      else if (e.key === '/') { e.preventDefault(); handleOp('÷'); }
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Backspace') handleBack();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  });

  const btnBg = (b: { l: string; type?: string }) => {
    if (b.type === 'clear' || b.type === 'fn') return 'rgba(255,255,255,0.08)';
    if (b.type === 'op') return op === b.l && reset ? '#fff' : '#02BDB6';
    if (b.type === 'eq') return '#02BDB6';
    return 'rgba(255,255,255,0.05)';
  };
  const btnColor = (b: { l: string; type?: string }) => {
    if (b.type === 'op' && op === b.l && reset) return '#02BDB6';
    if (b.type === 'op' || b.type === 'eq') return '#0a0a0f';
    return '#f1f5f9';
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />
      <div className="fixed left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        {/* Calculator */}
        <div className="flex w-72 flex-col" style={{ background: '#13131f' }}>
          <div className="flex flex-col items-end px-5 pb-3 pt-5">
            <div className="min-h-5 text-xs text-gray-500">{expression}</div>
            <div
              className="text-right font-bold text-gray-100"
              style={{ fontSize: display.length > 10 ? 24 : 32 }}
            >
              {display}
            </div>
          </div>
          <div className="flex flex-col gap-2 px-3 pb-4">
            {BTN_ROWS.map((row, ri) => (
              <div key={ri} className="flex gap-2">
                {row.map((b) => (
                  <button
                    key={b.l}
                    onClick={() => handleBtn(b)}
                    onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.7')}
                    onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                    style={{
                      flex: b.wide ? 2 : 1,
                      height: 56,
                      borderRadius: 12,
                      border: 'none',
                      background: btnBg(b),
                      color: btnColor(b),
                      fontSize: b.type ? 18 : 20,
                      cursor: 'pointer',
                      transition: 'opacity 100ms ease-out',
                    }}
                  >
                    {b.l}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="flex w-48 flex-col border-l border-white/8" style={{ background: '#0d0d1a' }}>
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <span className="text-caption font-semibold uppercase tracking-wider text-gray-500">История</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {history.length === 0 && (
              <div className="px-4 py-5 text-center text-caption text-gray-600">Пусто</div>
            )}
            {history.map((h, i) => (
              <div key={i} className="border-b border-white/4 px-4 py-2 text-caption leading-relaxed text-gray-500">
                {h}
              </div>
            ))}
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="m-2 rounded-lg border border-white/8 py-1.5 text-caption text-gray-500 hover:text-gray-300"
            >
              Очистить
            </button>
          )}
        </div>
      </div>
    </>
  );
}
