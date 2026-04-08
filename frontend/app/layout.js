import './globals.css'

export const metadata = {
  title: 'Теремка — CRM Типографии Рост',
  description: 'Система управления заказами',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
