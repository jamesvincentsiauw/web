/**
 * One-time admin bootstrap (TRD §3 Users). Refuses to run once any user exists, so it cannot be
 * used to add accounts later. Remove ADMIN_BOOTSTRAP_* from the environment afterwards.
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim()
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD

if (!email || !password) {
  console.error('Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD, then run again.')
  process.exit(1)
}
if (password.length < 12) {
  console.error('Use a password of at least 12 characters.')
  process.exit(1)
}

const payload = await getPayload({ config })
const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
if (totalDocs > 0) {
  console.error('An account already exists. Bootstrap is closed; manage users from the CMS.')
  process.exit(1)
}

await payload.create({ collection: 'users', data: { email, password, role: 'admin' }, overrideAccess: true })
console.log(`Admin account created for ${email}. Remove ADMIN_BOOTSTRAP_* from the environment now.`)
process.exit(0)
