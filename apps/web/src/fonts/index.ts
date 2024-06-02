import { Inter, Kanit, Noto_Sans_Thai, Sarabun } from 'next/font/google'
import localFont from 'next/font/local'

export const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
})

// export const sarabun = Sarabun({
//   weight: ['400', '500', '600', '700'],
//   subsets: ['latin'],
//   variable: '--font-sarabun',
// })

export const sarabun = localFont({
  src: [
    {
      weight: '400',
      style: 'normal',
      path: './Sarabun-Regular.ttf',
    },
    {
      weight: '500',
      style: 'normal',
      path: './Sarabun-Medium.ttf',
    },
    {
      weight: '600',
      style: 'normal',
      path: './Sarabun-SemiBold.ttf',
    },
    {
      weight: '700',
      style: 'normal',
      path: './Sarabun-Bold.ttf',
    },
  ],
  variable: '--font-sarabun',
})

export const notosans = Noto_Sans_Thai({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-notosans',
})
