import type { CollectionConfig, FieldHook } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

const normalizeCode: FieldHook = ({ value }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const Boroughs: CollectionConfig = {
  slug: 'boroughs',
  labels: { singular: 'Borough', plural: 'Boroughs' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'routeDaysGroup.routeDay'],
    description: 'Borough-level settings: policies and brand assets.',
  },
  access: {
    read: () => true,
    create: ({ req }) => ['admin', 'staff'].includes(req.user?.role),
    update: ({ req }) => ['admin', 'staff'].includes(req.user?.role),
    delete: ({ req }) => ['admin', 'staff'].includes(req.user?.role),
  },
  versions: { drafts: true },
  fields: [
    {
      name: 'code',
      label: 'Code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Short identifier, e.g. UPT' },
      validate: (val: unknown) =>
        /^[A-Z0-9_-]{2,12}$/.test(String(val ?? '')) || 'Use 2–12 chars: A–Z, 0–9, _ or -',
      hooks: { beforeValidate: [normalizeCode] },
    },
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'routeDaysGroup',
      label: 'Route Days',
      type: 'group',
      fields: [
        {
          name: 'routeDay',
          label: 'Route Days',
          type: 'select',
          hasMany: true,
          required: true,
          options: [
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
          ],
          admin: {
            description: 'Days of the week for collection route',
          },
        },
      ],
    },
    {
      name: 'policies',
      label: 'Policies',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
        ],
      }),
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      admin: {
        description: 'Street address',
      },
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
    },
    {
      name: 'state',
      label: 'State',
      type: 'text',
      admin: {
        description: 'State abbreviation (e.g., NY, CA)',
      },
    },
    {
      name: 'zip',
      label: 'ZIP Code',
      type: 'text',
      admin: {
        description: 'ZIP or postal code',
      },
      validate: (val: unknown) => {
        const zipStr = String(val ?? '').trim()
        return !zipStr || /^\d{5}(-\d{4})?$/.test(zipStr) || 'Enter a valid ZIP code (e.g., 12345 or 12345-6789)'
      },
    },
  ],
}

export default Boroughs
