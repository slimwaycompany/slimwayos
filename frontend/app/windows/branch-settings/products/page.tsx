import type { Metadata } from 'next';
import CrudPage, { type CrudConfig } from '@/app/components/CrudPage';

export const metadata: Metadata = { title: 'Товары' };

const config: CrudConfig = {
  title: 'Товары',
  entity: 'products',
  fields: [
    { key: 'name',      label: 'Название',  type: 'text',   required: true },
    { key: 'category',  label: 'Категория', type: 'select', required: true,
      options: [
        { value: 'merch',    label: 'Мерч' },
        { value: 'food',     label: 'Питание' },
        { value: 'supplies', label: 'Расходники' },
        { value: 'other',    label: 'Другое' },
      ] },
    { key: 'price',     label: 'Цена',              type: 'number', required: true },
    { key: 'stock_qty', label: 'Остаток на складе', type: 'number' },
  ],
  tableKeys: ['name', 'category', 'price', 'stock_qty'],
};

export default function ProductsPage() { return <CrudPage config={config} />; }
