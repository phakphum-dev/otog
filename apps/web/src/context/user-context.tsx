import { ReactNode, createContext, useCallback, useContext } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { Session, User } from 'next-auth'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

import { removeAccessToken, useHydrateSession } from '../api'

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
  useHydrateSession(props.session)

  const { data: session } = useSession()
  const user = session?.user ?? null

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'

  const queryClient = useQueryClient()
  const clearCache = useCallback(() => {
    queryClient.clear()
  }, [queryClient])
  const router = useRouter()
  const logout = useCallback(async () => {
    await signOut({ redirect: false })
    await router.push('/login')
    removeAccessToken()
    clearCache()
  }, [router, clearCache])

  const value = { user, isAuthenticated, isAdmin, logout, clearCache }
  return (
    <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
  )
}
