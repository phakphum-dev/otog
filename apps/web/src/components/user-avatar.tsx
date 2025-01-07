import { forwardRef } from 'react'

import { useQuery } from '@tanstack/react-query'
import BoringAvatar from 'boring-avatars'
import { useTheme } from 'next-themes'

import { Avatar, AvatarFallback, AvatarImage } from '@otog/ui/avatar'
import { cn } from '@otog/ui/utils'

import { avatarKey } from '../api/query'
import { AvatarSize } from '../firebase/get-avatar-url'
import { ClientOnly } from './client-only'

export interface UserAvatarProps {
  user: {
    id: number
    showName: string
  }
  size?: AvatarSize
  className?: string
}
export const UserAvatar = forwardRef<HTMLSpanElement, UserAvatarProps>(
  (props, ref) => {
    const { user, className, size = 'small' } = props
    const getAvatarUrl = useQuery({
      ...avatarKey.getUrl({ userId: user.id, size }),
    })

    const { resolvedTheme } = useTheme()
    return (
      <Avatar
        ref={ref}
        className={cn('size-6 min-w-6 rounded-full border', className)}
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
              size={size === 'small' ? 24 : 320}
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
