import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Market Method | More leads. More booked jobs.',
  description: 'Market Method builds revenue systems for local service businesses.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}