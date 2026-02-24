import { redirect } from 'next/navigation'

export default function DexStatusRedirect() {
    redirect('/dashboard?tab=dex-status')
}
