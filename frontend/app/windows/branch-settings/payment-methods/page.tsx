import type { Metadata } from 'next';
import CrudPage, { type CrudConfig } from '@/app/components/CrudPage';

export const metadata: Metadata = { title: 'Способы оплаты' };

const config: CrudConfig = {
  title: 'Способы оплаты',
  entity: 'payment-methods',
  fields: [
    { key: 'name',      label: 'Название', type: 'text',   required: true },
    { key: 'is_active', label: 'Активен',  type: 'toggle' },
  ],
  tableKeys: ['name', 'is_active'],
};

export default function PaymentMethodsPage() { return <CrudPage config={config} />; }
