import { redirect } from 'next/navigation'

export default function WhaleTrackerRedirect() {
    redirect('/dashboard?tab=whale-tracker')
}
