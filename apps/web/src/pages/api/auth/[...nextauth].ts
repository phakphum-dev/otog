// import GoogleProvider from 'next-auth/providers/google'
import * as cookie from 'cookie'
import { JwtPayload, jwtDecode } from 'jwt-decode'
import { NextApiRequest, NextApiResponse } from 'next'
import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { LoginResponse, UserWithourPasswordSchema } from '@otog/contract'

import { api, secure, setAccessToken } from '../../../api'
import { environment } from '../../../env'

class ServerContext {
  req?: {
    cookies: Partial<{
      [key: string]: string
    }>
  }
  res?: {
    setHeader(
      name: string,
      value: number | string | ReadonlyArray<string>
    ): void
  }
}
export const serverContext = new ServerContext()

export const authOptions: NextAuthOptions = {
  secret: environment.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID as string,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    // }),
    CredentialsProvider({
      id: 'otog',
      name: 'OTOG',
      credentials: {
        // accessToken: { label: 'accessToken', type: 'text' },
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        return await api
          .url('auth/login')
          .post(credentials)
          .res(async (r) => {
            const setCookie = r.headers.get('set-cookie')
            if (!setCookie) throw new Error('no set cookie')
            serverContext.res!.setHeader('set-cookie', setCookie)
            return (await r.json()) as LoginResponse
          })
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // console.log('session', session, token)
      return { ...session, ...token }
    },
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === 'update' && session?.accessToken) {
        // console.log('update', session.accessToken.at(-1))
        token.accessToken = session.accessToken
        return token
      }
      if (token.accessToken) {
        const accessToken = token.accessToken as string
        const { exp } = jwtDecode<JwtPayload>(accessToken)
        if (exp! * 1000 < Date.now()) {
          const RID = serverContext.req!.cookies['RID']
          if (!RID) throw new Error('No refresh token')
          const result = await api
            .auth(`Bearer ${accessToken}`)
            .headers({
              cookie: cookie.serialize('RID', RID, {
                httpOnly: true,
                secure: secure,
              }),
            })
            .get('auth/refresh/token')
            .forbidden((e) => {
              throw e
            })
            .res(async (r) => {
              const setCookie = r.headers.get('set-cookie')
              if (!setCookie) throw new Error('no set cookie')
              serverContext.res!.setHeader('set-cookie', setCookie)
              return (await r.json()) as LoginResponse
            })
          setAccessToken(result.accessToken)
          return { ...token, ...result }
        }
      }
      if (account?.provider === 'otog') {
        return { ...token, ...user }
      }
      return token
    },
  },
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  serverContext.req = req
  serverContext.res = res
  return await NextAuth(req, res, authOptions)
}

export type AccessTokenPayload = UserWithourPasswordSchema
export function getUserData(accessToken: string): AccessTokenPayload {
  const { id, username, showName, role, rating } = jwtDecode<
    AccessTokenPayload & JwtPayload
  >(accessToken)
  return { id, username, showName, role, rating }
}
