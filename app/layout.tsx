import type { Metadata } from 'next'
import './globals.css'
import './eyebrow-overrides.css'
import './brand-overrides.css'

export const metadata: Metadata = {
  title: 'Market Method | More leads. More booked jobs.',
  description: 'Market Method builds revenue systems for local service businesses.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
