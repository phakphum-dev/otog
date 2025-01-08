import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { useSession } from 'next-auth/react'
import socketIOClient, { Socket } from 'socket.io-client'

import { environment } from '../env'
import { useUserContext } from './user-context'

export interface SocketContextValue {
  socket: Socket | null
}

const SocketContext = createContext<SocketContextValue | null>(null)

export const SocketProvider = ({ children }: { children?: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const { isAuthenticated } = useUserContext()
  const { data: session } = useSession()
  useEffect(() => {
    if (!environment.OFFLINE_MODE && isAuthenticated) {
      const socketClient = socketIOClient(environment.SOCKET_HOST, {
        auth: { token: session?.accessToken },
      })
      setSocket(socketClient)
      return () => {
        socketClient.disconnect()
      }
    }
  }, [session?.accessToken, isAuthenticated])

  const value = { socket }
  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  )
}

export function useSocketContext() {
  const socketContext = useContext(SocketContext)
  if (socketContext === null) {
    throw new Error('useSocket should be inside of SocketProvider')
  }
  return socketContext
}
