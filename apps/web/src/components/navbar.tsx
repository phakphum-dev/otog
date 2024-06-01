import { ForwardedRef, useEffect, useRef } from 'react'

import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { Session, User } from 'next-auth'
// import { useUserData } from '@src/context/UserContext'
// import { useDisclosure } from '@src/hooks/useDisclosure'
// import { ChevronDownIcon } from '@src/icons/ChevronDownIcon'
// import { HamburgerIcon } from '@src/icons/HamburgerIcon'
// import { useUserSmallAvatar } from '@src/profile/useAvartar'
// import { IconButton } from '@src/ui/IconButton'
// import { Link } from '@src/ui/Link'
// import { Menu, MenuButton, MenuItem, MenuList } from '@src/ui/Menu'
// import clsx from 'clsx'
import Image from 'next/image'
import NextLink from 'next/link'
import { useRouter } from 'next/router'

// import { SearchMenu } from './SearchMenu'
import {
  Button,
  ButtonProps,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Link,
} from '@otog/ui'

import Logo from '../../public/logo512.png'
import { keyAvatar } from '../api/query'
import { useUserContext } from '../context/user-context'
// import { Avatar } from '../Avatar'
// import { ToggleColorModeButton } from '../ToggleColorModeButton'
import { environment } from '../env'
import { ThemeToggle } from './theme-provider'
import { UserAvatar } from './user-avatar'

export const Navbar = () => {
  const { user } = useUserContext()
  return (
    <>
      <div className="h-14 w-full" />
      <nav className="fixed inset-x-0 top-0 z-20 h-14 border-b border-border bg-background shadow-sm">
        <div className="container flex h-full justify-between items-center">
          <Link asChild className="p-1 rounded-full">
            <NextLink href="/">
              <Image
                src={Logo}
                width={32}
                height={32}
                title="One Tambon One Grader"
                alt="One Tambon One Grader Logo"
              />
            </NextLink>
          </Link>
          <div className="flex gap-2">
            <ThemeToggle />
            {user ? (
              <Menu user={user} />
            ) : (
              <Button asChild variant="ghost">
                <NextLink href="/login">เข้าสู่ระบบ</NextLink>
              </Button>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

interface MenuProps {
  user: User['user']
}
const Menu = ({ user }: MenuProps) => {
  const { logout } = useUserContext()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <MyAvatar user={user} />
          <ChevronDownIcon className="size-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <NextLink href={`/user/${user.id}`}>
            <UserIcon />
            โปรไฟล์
          </NextLink>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} className="text-destructive">
          <ArrowRightStartOnRectangleIcon />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const MyAvatar = ({ user }: { user: User['user'] }) => {
  const getAvatarUrl = useQuery({
    ...keyAvatar.small({ userId: user.id }),
  })
  return <UserAvatar name={user.showName} src={getAvatarUrl.data} />
}
