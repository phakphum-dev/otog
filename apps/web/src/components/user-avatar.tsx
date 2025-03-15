import { forwardRef } from 'react'

import { useQuery } from '@tanstack/react-query'
import BoringAvatar from 'boring-avatars'

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
    // TODO: implement img url in session instead
    const getAvatarUrl = useQuery(avatarKey.getUrl({ userId: user.id, size }))

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
              colors={colors}
            />
          </ClientOnly>
        </AvatarFallback>
      </Avatar>
    )
  }
)
UserAvatar.displayName = 'UserAvatar'

const colors = [
  '#ffd5ae',
  '#b1e9fc',
  '#b9f6ba',
  '#ffb1b2',
  '#ffe0ae',
  '#CBD5E0',
]
