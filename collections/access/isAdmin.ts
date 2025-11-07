import type { Access } from 'payload'

const isAdmin: Access = ({ req }) => {
  return req.user?.role === 'admin'
}

export default isAdmin

