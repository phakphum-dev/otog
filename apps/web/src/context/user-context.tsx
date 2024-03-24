import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
} from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { User } from 'next-auth'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

import { removeAccessToken } from '../api'

export interface UserProviderProps {
  logout: () => void
  user: User['user'] | null
  isAuthenticated: boolean
  isAdmin: boolean
  clearCache: () => void
}

const UserContext = createContext({} as UserProviderProps)
export const useUserContext = () => useContext(UserContext)
export const UserContextProvider = (props: PropsWithChildren) => {
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
    await router.push('/login')
    await signOut({ redirect: false })
    removeAccessToken()
    clearCache()
  }, [router, clearCache])

  const value = { user, isAuthenticated, isAdmin, logout, clearCache }
  return (
    <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
  )
}
