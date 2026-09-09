import type { Metadata } from 'next';
import CrudPage, { type CrudConfig } from '@/app/components/CrudPage';

export const metadata: Metadata = { title: 'Документооборот' };

const config: CrudConfig = {
  title: 'Шаблоны документов',
  entity: 'document-templates',
  fields: [
    { key: 'name',    label: 'Название шаблона', type: 'text',     required: true },
    { key: 'content', label: 'Содержимое',       type: 'textarea', hideInTable: true },
  ],
  tableKeys: ['name'],
};

export default function DocumentTemplatesPage() { return <CrudPage config={config} />; }
