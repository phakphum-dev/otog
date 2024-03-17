import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next'
import { Session, getServerSession } from 'next-auth'
import { ParsedUrlQuery } from 'querystring'

import { setAccessToken } from '../api'
import { authOptions, serverContext } from '../pages/api/auth/[...nextauth]'

export function withSession<
  P extends { [key: string]: any },
  T extends GetServerSidePropsResult<P> = GetServerSidePropsResult<P>,
>(
  callback: (session: Session | null, context: Context) => Promise<T> | T
): GetServerSideProps<P> {
  return async (context) => {
    const { req, res } = context
    serverContext.req = req
    serverContext.res = res
    const session = await getServerSession(req, res, authOptions)
    setAccessToken(session?.accessToken ?? null)
    const result = await callback(session, context)
    if ('props' in result) {
      return { props: { ...result.props, session } }
    }
    return result
  }
}

export type Context = GetServerSidePropsContext<ParsedUrlQuery>
