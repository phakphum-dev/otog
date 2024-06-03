import { forwardRef } from 'react'

import { useQuery } from '@tanstack/react-query'
import BoringAvatar from 'boring-avatars'
import { useTheme } from 'next-themes'

import { Avatar, AvatarFallback, AvatarImage, clsx } from '@otog/ui'

import { keyAvatar } from '../api/query'
import { AvatarSize } from '../firebase/get-avatar-url'
import { ClientOnly } from './client-only'

export type UserAvatarProps = {
  user: {
    id: number
    showName: string
  }
  size?: AvatarSize
  className?: string
}
export const UserAvatar = forwardRef<HTMLSpanElement, UserAvatarProps>(
  (props, ref) => {
    const { user, className } = props

    // TODO: remove query from frontend
    const getAvatarUrl = useQuery({
      ...keyAvatar.getUrl({ userId: user.id, size: props.size ?? 'small' }),
      enabled: false,
    })

    const { resolvedTheme } = useTheme()
    return (
      <Avatar
        ref={ref}
        className={clsx('h-6 w-6 min-w-6 rounded-full border', className)}
      >
        <AvatarImage
          className="object-cover"
          src={getAvatarUrl.data!}
          alt={`Profile Picture of ${user.showName}`}
          title={user.showName}
        />
        <AvatarFallback>
          <ClientOnly>
            <BoringAvatar
              square
              size={24}
              name={user.showName}
              variant="beam"
              colors={colors[resolvedTheme === 'dark' ? 'dark' : 'light']}
            />
          </ClientOnly>
        </AvatarFallback>
      </Avatar>
    )
  }
)
UserAvatar.displayName = 'UserAvatar'

const colors = {
  light: ['#F7FAFC', '#EDF2F7', '#E2E8F0'],
  dark: ['#2D3748', '#1A202C', '#171923'],
}
