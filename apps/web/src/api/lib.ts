import { createQueryKeys } from '@lukemorales/query-key-factory'
import {
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
} from '@tanstack/react-query'
import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  ClientArgs,
  ClientInferRequest,
  PartialClientInferRequest,
  Without,
  fetchApi,
  getCompleteUrl,
  isAppRoute,
} from '@ts-rest/core'
import { DataResponse } from '@ts-rest/react-query'

import { createQueryClient, clientArgs as defaultClientArgs } from '.'

// from luke
type AnyMutableOrReadonlyArray = any[] | readonly any[]
type Tuple = [ValidValue | undefined, ...Array<ValidValue | undefined>]
type KeyTuple = Tuple | Readonly<Tuple>
type ValidValue = string | number | boolean | object | bigint
type DefinitionKey<Key extends AnyMutableOrReadonlyArray> = {
  _def: readonly [...Key]
}

type NullableQueryKeyRecord = Record<'queryKey', KeyTuple | null>
type QueryKeyRecord = Record<'queryKey', KeyTuple>
type KeySchemaWithContextualQueries = NullableQueryKeyRecord & {
  contextQueries: QueryFactorySchema
}
type $QueryFactorySchema = NullableQueryKeyRecord & {
  queryFn: QueryFunction
}
type QueryFactoryWithContextualQueriesSchema = NullableQueryKeyRecord & {
  queryFn: QueryFunction
  contextQueries: QueryFactorySchema
}
type DynamicKeySchemaWithContextualQueries = QueryKeyRecord & {
  contextQueries: QueryFactorySchema
}
type DynamicQueryFactorySchema = QueryKeyRecord & {
  queryFn: QueryFunction
}
type DynamicQueryFactoryWithContextualQueriesSchema = QueryKeyRecord & {
  queryFn: QueryFunction
  contextQueries: QueryFactorySchema
}
type FactoryProperty =
  | null
  | KeyTuple
  | NullableQueryKeyRecord
  | KeySchemaWithContextualQueries
  | $QueryFactorySchema
  | QueryFactoryWithContextualQueriesSchema
type DynamicKey = (
  ...args: any[]
) =>
  | DynamicQueryFactoryWithContextualQueriesSchema
  | DynamicQueryFactorySchema
  | DynamicKeySchemaWithContextualQueries
  | QueryKeyRecord
  | KeyTuple
type QueryFactorySchema = Record<string, FactoryProperty | DynamicKey>
type ExtractNullableKey$1<Key extends KeyTuple | null | undefined> =
  Key extends [...infer Value] | readonly [...infer Value]
    ? Value
    : Key extends null | undefined | unknown
      ? null
      : never
type ComposeQueryKey$1<
  BaseKey extends AnyMutableOrReadonlyArray,
  Key,
> = Key extends KeyTuple ? readonly [...BaseKey, ...Key] : readonly [...BaseKey]
type QueryOptionsStruct<
  Keys extends AnyMutableOrReadonlyArray,
  Fetcher extends QueryFunction,
  FetcherResult extends ReturnType<Fetcher> = ReturnType<Fetcher>,
> = {
  queryKey: readonly [...Keys]
  queryFn: QueryFunction<Awaited<FetcherResult>, readonly [...Keys]>
}
type FactoryWithContextualQueriesOutput<
  BaseKey extends AnyMutableOrReadonlyArray,
  Schema extends
    | KeySchemaWithContextualQueries
    | DynamicKeySchemaWithContextualQueries,
  SchemaQueryKey extends Schema['queryKey'] = Schema['queryKey'],
  ContextQueries extends Schema['contextQueries'] = Schema['contextQueries'],
  ComposedKey extends AnyMutableOrReadonlyArray = ComposeQueryKey$1<
    BaseKey,
    ExtractNullableKey$1<SchemaQueryKey>
  >,
> = SchemaQueryKey extends null
  ? Omit<QueryOptionsStruct<ComposedKey, QueryFunction>, 'queryFn'> & {
      _ctx: {
        [P in keyof ContextQueries]: ContextQueries[P] extends DynamicKey
          ? DynamicFactoryOutput<[...ComposedKey, P], ContextQueries[P]>
          : ContextQueries[P] extends FactoryProperty
            ? StaticFactoryOutput<[...ComposedKey, P], ContextQueries[P]>
            : never
      }
    }
  : Omit<QueryOptionsStruct<ComposedKey, QueryFunction>, 'queryFn'> &
      DefinitionKey<BaseKey> & {
        _ctx: {
          [P in keyof ContextQueries]: ContextQueries[P] extends DynamicKey
            ? DynamicFactoryOutput<[...ComposedKey, P], ContextQueries[P]>
            : ContextQueries[P] extends FactoryProperty
              ? StaticFactoryOutput<[...ComposedKey, P], ContextQueries[P]>
              : never
        }
      }
type FactoryQueryKeyRecordOutput<
  BaseKey extends AnyMutableOrReadonlyArray,
  Schema extends NullableQueryKeyRecord | QueryKeyRecord,
  SchemaQueryKey extends Schema['queryKey'] = Schema['queryKey'],
  ComposedKey extends AnyMutableOrReadonlyArray = ComposeQueryKey$1<
    BaseKey,
    ExtractNullableKey$1<SchemaQueryKey>
  >,
> = SchemaQueryKey extends null
  ? Omit<QueryOptionsStruct<BaseKey, QueryFunction>, 'queryFn'>
  : Omit<QueryOptionsStruct<ComposedKey, QueryFunction>, 'queryFn'> &
      DefinitionKey<BaseKey>
type FactoryQueryOptionsOutput<
  BaseKey extends AnyMutableOrReadonlyArray,
  Schema extends $QueryFactorySchema | DynamicQueryFactorySchema,
  SchemaQueryKey extends Schema['queryKey'] = Schema['queryKey'],
  QueryFn extends Schema['queryFn'] = Schema['queryFn'],
  ComposedKey extends AnyMutableOrReadonlyArray = ComposeQueryKey$1<
    BaseKey,
    ExtractNullableKey$1<SchemaQueryKey>
  >,
> = SchemaQueryKey extends null
  ? QueryOptionsStruct<BaseKey, QueryFn>
  : QueryOptionsStruct<ComposedKey, QueryFn> & DefinitionKey<BaseKey>
type FactoryQueryOptionsWithContextualQueriesOutput<
  BaseKey extends AnyMutableOrReadonlyArray,
  Schema extends
    | QueryFactoryWithContextualQueriesSchema
    | DynamicQueryFactoryWithContextualQueriesSchema,
  SchemaQueryKey extends Schema['queryKey'] = Schema['queryKey'],
  QueryFn extends Schema['queryFn'] = Schema['queryFn'],
  ContextQueries extends Schema['contextQueries'] = Schema['contextQueries'],
  Key extends AnyMutableOrReadonlyArray = ComposeQueryKey$1<
    BaseKey,
    ExtractNullableKey$1<SchemaQueryKey>
  >,
> = SchemaQueryKey extends null
  ? QueryOptionsStruct<Key, QueryFn> & {
      _ctx: {
        [P in keyof ContextQueries]: ContextQueries[P] extends DynamicKey
          ? DynamicFactoryOutput<[...Key, P], ContextQueries[P]>
          : ContextQueries[P] extends FactoryProperty
            ? StaticFactoryOutput<[...Key, P], ContextQueries[P]>
            : never
      }
    }
  : DefinitionKey<BaseKey> &
      QueryOptionsStruct<Key, QueryFn> & {
        _ctx: {
          [P in keyof ContextQueries]: ContextQueries[P] extends DynamicKey
            ? DynamicFactoryOutput<[...Key, P], ContextQueries[P]>
            : ContextQueries[P] extends FactoryProperty
              ? StaticFactoryOutput<[...Key, P], ContextQueries[P]>
              : never
        }
      }
type DynamicFactoryOutput<
  Keys extends AnyMutableOrReadonlyArray,
  Generator extends DynamicKey,
  Output extends ReturnType<Generator> = ReturnType<Generator>,
> = ((
  ...args: Parameters<Generator>
) => Output extends [...infer TupleResult] | readonly [...infer TupleResult]
  ? Omit<
      QueryOptionsStruct<[...Keys, ...TupleResult], QueryFunction>,
      'queryFn'
    >
  : Output extends DynamicQueryFactoryWithContextualQueriesSchema
    ? Omit<FactoryQueryOptionsWithContextualQueriesOutput<Keys, Output>, '_def'>
    : Output extends DynamicQueryFactorySchema
      ? Omit<FactoryQueryOptionsOutput<Keys, Output>, '_def'>
      : Output extends DynamicKeySchemaWithContextualQueries
        ? Omit<FactoryWithContextualQueriesOutput<Keys, Output>, '_def'>
        : Output extends QueryKeyRecord
          ? Omit<FactoryQueryKeyRecordOutput<Keys, Output>, '_def'>
          : never) &
  DefinitionKey<Keys>
type StaticFactoryOutput<
  Keys extends AnyMutableOrReadonlyArray,
  Property extends FactoryProperty,
> = Property extends null
  ? Omit<QueryOptionsStruct<Keys, QueryFunction>, 'queryFn'>
  : Property extends [...infer Result] | readonly [...infer Result]
    ? DefinitionKey<Keys> &
        Omit<QueryOptionsStruct<[...Keys, ...Result], QueryFunction>, 'queryFn'>
    : Property extends QueryFactoryWithContextualQueriesSchema
      ? FactoryQueryOptionsWithContextualQueriesOutput<Keys, Property>
      : Property extends $QueryFactorySchema
        ? FactoryQueryOptionsOutput<Keys, Property>
        : Property extends KeySchemaWithContextualQueries
          ? FactoryWithContextualQueriesOutput<Keys, Property>
          : Property extends NullableQueryKeyRecord
            ? FactoryQueryKeyRecordOutput<Keys, Property>
            : never

// custom
type PickQueryKeyArgs<TArgs> = (TArgs extends { params?: infer TParams }
  ? { params?: TParams }
  : {}) &
  (TArgs extends { query?: infer TQuery } ? { query?: TQuery } : {})

export type QueryKeyArgs<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = PickQueryKeyArgs<PartialClientInferRequest<TAppRoute, TClientArgs>>

export function getQueryKey<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
>(route: TAppRoute, args: QueryKeyArgs<TAppRoute, TClientArgs>) {
  const { params = {}, query = {} } = (args || {}) as unknown as any
  return ['ts-rest', route.method, route.path, { params, query }] as QueryKey
}

export const getQueryFn = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
  args?: ClientInferRequest<AppRouteMutation, ClientArgs>
): QueryFunction<DataResponse<TAppRoute>> => {
  return async (queryFnContext?: QueryFunctionContext) => {
    const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
      args || {}

    const path = getCompleteUrl(
      query,
      clientArgs.baseUrl,
      params,
      route,
      !!clientArgs.jsonQuery
    )

    const result = await fetchApi({
      path,
      clientArgs,
      route,
      body,
      query,
      headers: {
        ...extraHeaders,
        ...headers,
      },
      extraInputArgs,
      fetchOptions: {
        signal: queryFnContext?.signal,
      },
    })

    // If the response is not a 2XX, throw an error to be handled by react-query
    if (!String(result.status).startsWith('2')) {
      throw result
    }

    return result as DataResponse<TAppRoute>
  }
}

type QueryRouteDynamicKey<
  TAppRouteQuery extends AppRouteQuery,
  TClientArgs extends ClientArgs,
> = (args?: QueryKeyArgs<TAppRouteQuery, TClientArgs>) => {
  queryKey: KeyTuple
  queryFn: QueryFunction<DataResponse<TAppRouteQuery>> // AppRouteFunction<TAppRoute, TClientArgs>
}

type RouteQueryFactorySchema<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = TAppRoute extends AppRouteQuery
  ? QueryRouteDynamicKey<TAppRoute, TClientArgs>
  : never

type RouteFactorySchema<
  TAppRouter extends AppRouter,
  TClientArgs extends ClientArgs,
> = Without<
  {
    [TKey in keyof TAppRouter]: TAppRouter[TKey] extends AppRoute
      ? RouteQueryFactorySchema<TAppRouter[TKey], TClientArgs>
      : never
  },
  never
>

type RouteFactoryOutput<
  Key extends string,
  Schema extends Record<string, (...args: any[]) => DynamicQueryFactorySchema>,
> = DefinitionKey<[Key]> & {
  [P in keyof Schema]: Schema[P] extends DynamicKey
    ? DynamicFactoryOutput<[Key, P], Schema[P]>
    : Schema[P] extends FactoryProperty
      ? StaticFactoryOutput<[Key, P], Schema[P]>
      : never
}

export const createQueryAndKey = <
  TName extends string,
  TAppRouter extends AppRouter,
  TClientArgs extends ClientArgs,
>(
  name: TName,
  router: TAppRouter,
  clientArgs = defaultClientArgs
) => {
  const query = createQueryClient(router, clientArgs)
  const schema: QueryFactorySchema = Object.fromEntries(
    Object.entries(router)
      .map(([key, subRouter]) => {
        if (!isAppRoute(subRouter)) {
          return null
        }
        if (subRouter.method !== 'GET') {
          return null
        }
        return [
          key,
          (args: QueryKeyArgs<typeof subRouter, TClientArgs>) => ({
            queryKey: getQueryKey(subRouter, args) as KeyTuple,
            queryFn: getQueryFn(subRouter, clientArgs, args as any),
          }),
        ] satisfies [string, DynamicKey]
      })
      .filter((entry) => entry !== null)
  )
  const key = createQueryKeys(name, schema) as RouteFactoryOutput<
    TName,
    RouteFactorySchema<TAppRouter, TClientArgs>
  >
  return [query, key] as const
}
