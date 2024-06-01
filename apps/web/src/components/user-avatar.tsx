import { forwardRef } from 'react'

import BoringAvatar from 'boring-avatars'

import { Avatar, AvatarFallback, AvatarImage, clsx } from '@otog/ui'

export type AvatarProps = {
  name: string
  src?: string | null
  className?: string
}
export const UserAvatar = forwardRef<HTMLDivElement, AvatarProps>(
  (props, ref) => {
    const { name, src, className } = props
    return (
      <Avatar
        className={clsx('h-6 w-6 min-w-6 rounded-full object-cover', className)}
      >
        <AvatarImage src={src!} alt={`Profile Picture of ${name}`} />
        <AvatarFallback>
          <BoringAvatar
            square
            size={24}
            name={name}
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
