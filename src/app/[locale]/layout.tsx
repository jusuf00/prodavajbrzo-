import { notFound } from 'next/navigation'
import { locales } from '../../../i18n'
import { Providers } from '@/lib/providers'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Ensure that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound()
  }

  return (
    <Providers>
      <main className="flex-1 pb-45">
        {children}
      </main>
    </Providers>
  )
}