import type { CollectionConfig } from 'payload'
import isAdmin from './access/isAdmin'

const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'User', plural: 'Users' },
  admin: {
    group: 'Settings',
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'updatedAt'],
  },
  auth: true,
  access: {
    read: () => true,
    create: async ({ req }) => {
      // Allow creating the first user, or if user is admin
      if (req.user?.role === 'admin') return true
      const userCount = await req.payload.count({
        collection: 'users',
      })
      return userCount.totalDocs === 0
    },
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Staff', value: 'staff' },
        { label: 'User', value: 'user' },
      ],
      admin: {
        description: 'User role determines access permissions',
      },
    },
  ],
}

export default Users

