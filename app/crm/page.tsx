import { redirect } from 'next/navigation'
import { getSession } from '../../lib/auth'

export default function CRMEntry(){
 const session=getSession()
 redirect(session?'/crm/dashboard':'/crm/login')
}
