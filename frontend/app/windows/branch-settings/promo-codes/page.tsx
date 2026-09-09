import type { Metadata } from 'next';
import CrudPage, { type CrudConfig } from '@/app/components/CrudPage';

export const metadata: Metadata = { title: 'Промокоды' };

const config: CrudConfig = {
  title: 'Промокоды',
  entity: 'promo-codes',
  fields: [
    { key: 'code',           label: 'Код',               type: 'text',   required: true },
    { key: 'discount_type',  label: 'Тип скидки',        type: 'select', required: true,
      options: [{ value: 'percent', label: 'Процент (%)' }, { value: 'fixed', label: 'Фикс. сумма' }] },
    { key: 'discount_value', label: 'Размер скидки',     type: 'number', required: true },
    { key: 'starts_at',     label: 'Дата начала',        type: 'date' },
    { key: 'ends_at',       label: 'Дата окончания',     type: 'date' },
    { key: 'usage_limit',   label: 'Лимит использований', type: 'number' },
  ],
  tableKeys: ['code', 'discount_type', 'discount_value', 'starts_at', 'ends_at', 'usage_limit'],
};

export default function PromoCodesPage() { return <CrudPage config={config} />; }
