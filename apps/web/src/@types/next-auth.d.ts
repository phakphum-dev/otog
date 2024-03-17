// import { JWT as NextAuthJWT } from 'next-auth/jwt'
import { LoginResponse } from '@otog/contract'

declare module 'next-auth' {
  type User = LoginResponse
  type Session = User
}

// declare module 'next-auth/jwt' {
//   type JWT = LoginResponse
// }
