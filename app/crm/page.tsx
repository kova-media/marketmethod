import { redirect } from 'next/navigation'
import { getSession } from '../../lib/auth'

export default async function CRMEntry() {
  const session = await getSession()
  redirect(session ? '/crm/dashboard' : '/crm/login')
}
