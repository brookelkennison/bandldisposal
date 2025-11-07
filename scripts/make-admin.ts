import { getPayload } from 'payload'
import config from '../payload.config'

async function makeAdmin() {
  const payload = await getPayload({ 
    config,
    local: true, // Bypass access control
  })

  // Get all users
  const users = await payload.find({
    collection: 'users',
    limit: 100,
  })

  if (users.docs.length === 0) {
    console.log('No users found.')
    process.exit(1)
  }

  console.log('Found users:')
  users.docs.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (role: ${user.role || 'not set'})`)
  })

  // Update the first user to admin (or you can specify an email)
  const userToUpdate = users.docs[0]
  
  if (userToUpdate.role === 'admin') {
    console.log(`\nUser ${userToUpdate.email} is already an admin.`)
    process.exit(0)
  }

  await payload.update({
    collection: 'users',
    id: userToUpdate.id,
    data: {
      role: 'admin',
    },
  })

  console.log(`\n✅ Successfully updated ${userToUpdate.email} to admin role.`)
  process.exit(0)
}

makeAdmin().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})

