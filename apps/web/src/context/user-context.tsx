import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
} from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { Session, User } from 'next-auth'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

import { clearAccessToken, getAccessToken } from '../api/auth'
import { authQuery } from '../api/query'

export interface UserContextValue {
  logout: () => void
  user: User['user'] | null
  isAuthenticated: boolean
  isAdmin: boolean
  clearCache: () => void
}
export interface UserProviderProps {
  session: Session
  children?: ReactNode
}

const UserContext = createContext<UserContextValue>({} as UserContextValue)
export const useUserContext = () => useContext(UserContext)
export const UserContextProvider = (props: UserProviderProps) => {
  useSyncAccessToken()
  const { data: session } = useSession()
  const user = session?.user ?? null
  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'

  const queryClient = useQueryClient()
  const clearCache = useCallback(() => {
    queryClient.clear()
  }, [queryClient])
  const router = useRouter()
  const logoutQuery = authQuery.logout.useMutation()
  const logout = useCallback(async () => {
    logoutQuery.mutateAsync({ body: {} })
    await signOut({ redirect: false })
    await router.push('/login')
    clearAccessToken()
    clearCache()
  }, [router, clearCache])

  useEffect(() => {
    if ((session as any)?.error === 'RefreshAccessTokenError') {
      logout()
    }
  }, [session])

  const value = { user, isAuthenticated, isAdmin, logout, clearCache }
  return (
    <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
  )
}

// update accessToken in session on server side when it's changed
const useSyncAccessToken = () => {
  const { update, data: session } = useSession()
  useEffect(() => {
    if (session === null) return
    let lastToken = getAccessToken()
    const interval = setInterval(() => {
      let token = getAccessToken()
      if (token !== lastToken) {
        update({ accessToken: token })
      }
      lastToken = token
    }, 100)
    return () => clearInterval(interval)
  }, [session])
}
