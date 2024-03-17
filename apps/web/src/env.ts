/* eslint-disable turbo/no-undeclared-env-vars */
import { parseEnv, z } from 'znv'

export const isServer = typeof window === 'undefined'
const requireOnServer = (value: string | undefined) =>
  isServer ? value !== undefined : true

export const environment = parseEnv(
  {
    // process.env is not a normal object, especially in the browser
    NODE_ENV: process.env.NODE_ENV,

    APP_HOST: process.env.NEXT_PUBLIC_APP_HOST,
    API_HOST: process.env.NEXT_PUBLIC_API_HOST,
    API_HOST_SSR: process.env.API_HOST_SSR,
    SOCKET_HOST: process.env.NEXT_PUBLIC_SOCKET_HOST,

    FIREBASE_CONFIG: process.env.NEXT_PUBLIC_FIREBASE_CONFIG,
    SEGMENT_API_KEY: process.env.NEXT_PUBLIC_SEGMENT_API_KEY,
    OFFLINE_MODE: process.env.NEXT_PUBLIC_OFFLINE_MODE,

    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

    CONTACT_LINK: process.env.NEXT_PUBLIC_CONTACT_LINK,
    GITHUB_LINK: process.env.NEXT_PUBLIC_GITHUB_LINK,
  },
  {
    NODE_ENV: z.enum(['development', 'production']),

    APP_HOST: z.string(),
    API_HOST: z.string(),
    API_HOST_SSR: z.string().optional().refine(requireOnServer),
    SOCKET_HOST: z.string(),

    FIREBASE_CONFIG: z.string().transform((base64) => {
      const json = Buffer.from(base64, 'base64').toString('ascii')
      return JSON.parse(json)
    }),
    // SEGMENT_API_KEY: z.string(),
    OFFLINE_MODE: z.boolean(),

    NEXTAUTH_URL: z.string().optional().refine(requireOnServer),
    NEXTAUTH_SECRET: z.string().optional().refine(requireOnServer),

    CONTACT_LINK: z.string(),
    GITHUB_LINK: z.string(),
  }
)
