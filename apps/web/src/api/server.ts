import { ClientArgs } from '@ts-rest/core'
import { TsRestReactQueryClient, initQueryClient } from '@ts-rest/react-query'
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next'
import { Session, getServerSession } from 'next-auth'
import { ParsedUrlQuery } from 'querystring'

import { router } from '@otog/contract'

import { api } from '.'
import { getAuthOptions } from '../pages/api/auth/[...nextauth]'

type Context = GetServerSidePropsContext<ParsedUrlQuery>
export async function getServerSideProps(context: Context) {
  const authOptions = getAuthOptions(context)
  const session = await getServerSession(context.req, context.res, authOptions)
  return { props: { session } }
}

export function withSession<
  P extends { [key: string]: any },
  T extends GetServerSidePropsResult<P> = GetServerSidePropsResult<P>,
>(
  callback: (args: {
    session: Session | null
    context: Context
  }) => Promise<T> | T
): GetServerSideProps<P> {
  return async (context) => {
    const authOptions = getAuthOptions(context)
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions
    )
    const result = await callback({ session, context })
    if ('props' in result) {
      return { props: { ...result.props, session } }
    }
    return result
  }
}

export function withQuery<
  P extends { [key: string]: any },
  T extends GetServerSidePropsResult<P> = GetServerSidePropsResult<P>,
>(
  callback: (args: {
    session: Session | null
    context: Context
    query: TsRestReactQueryClient<typeof router, any>
  }) => Promise<T> | T
): GetServerSideProps<P> {
  return async (context) => {
    const authOptions = getAuthOptions(context)
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions
    )
    const clientArgs: ClientArgs = {
      baseUrl: '',
      jsonQuery: true,
      api: async ({ path, method, headers, body }) => {
        return api
          .auth(session ? `Bearer ${session.accessToken}` : '')
          .body(body)
          .headers(headers)
          .fetch(method, path)
          .res()
          .then(async (response) => {
            return {
              status: response.status,
              body: await response.json(),
              headers: response.headers,
            }
          })
          .catch((error) => {
            return {
              status: error.status,
              body: error.json,
              headers: error.headers,
            }
          })
      },
    }
    const query = initQueryClient(router, clientArgs)
    const result = await callback({ session, context, query })
    if ('props' in result) {
      return { props: { ...result.props, session } }
    }
    return result
  }
}
