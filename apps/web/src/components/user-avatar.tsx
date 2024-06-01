import { forwardRef } from 'react'

import { useQuery } from '@tanstack/react-query'
import BoringAvatar from 'boring-avatars'

import { Avatar, AvatarFallback, AvatarImage, clsx } from '@otog/ui'

import { keyAvatar } from '../api/query'
import { AvatarSize } from '../firebase/getAvatarUrl'

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

    const getAvatarUrl = useQuery({
      ...keyAvatar.getUrl({ userId: user.id, size: props.size ?? 'small' }),
    })

    return (
      <Avatar
        ref={ref}
        className={clsx(
          'h-6 w-6 min-w-6 rounded-full object-cover border',
          className
        )}
      >
        <AvatarImage
          src={getAvatarUrl.data!}
          alt={`Profile Picture of ${user.showName}`}
        />
        <AvatarFallback>
          <BoringAvatar
            square
            size={24}
            name={user.showName}
            variant="beam"
            colors={[
              '#ffd5ae',
              '#b1e9fc',
              '#b9f6ba',
              '#ffb1b2',
              '#ffe0ae',
              '#CBD5E0',
            ]}
          />
        </AvatarFallback>
      </Avatar>
    )
  }
)
UserAvatar.displayName = 'UserAvatar'
