import { ReactNode } from 'react'

import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { User } from 'next-auth'
import Image from 'next/image'
import NextLink from 'next/link'
import { useRouter } from 'next/router'

import { Button } from '@otog/ui/button'
// import { SearchMenu } from './SearchMenu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@otog/ui/dropdown-menu'
import { Link } from '@otog/ui/link'
import { clsx } from '@otog/ui/utils'

import Logo from '../../public/logo512.png'
import { useUserContext } from '../context/user-context'
import { ThemeToggle } from './theme-provider'
import { UserAvatar } from './user-avatar'

export const Navbar = () => {
  const { user } = useUserContext()
  return (
    <>
      <div className="h-[--navbar] w-full" />
      <nav className="fixed inset-x-0 top-0 z-20 h-[--navbar] border-b border-border bg-background shadow-sm">
        <div className="container flex h-full justify-between items-center">
          <div className="flex gap-2 items-center">
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
            <NavButton href="/" exact className="ml-6">
              โจทย์
            </NavButton>
            <NavButton href="/submission">ผลตรวจ</NavButton>
            <NavButton href="/contest">แข่งขัน</NavButton>
          </div>
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

function usePathActive(props: { href: string; exact?: boolean }) {
  const { pathname } = useRouter()
  return props.exact
    ? props.href === pathname
    : props.href.split('/')[1] === pathname.split('/')[1]
}

const NavButton = (props: {
  href: string
  exact?: boolean
  children: ReactNode
  className?: string
}) => {
  const isActive = usePathActive(props)
  const { pathname } = useRouter()

  return (
    <Button
      asChild
      variant="ghost"
      className={clsx(
        'aria-[current=true]:text-foreground text-muted-foreground',
        props.className
      )}
    >
      <NextLink
        aria-current={isActive}
        href={props.href}
        scroll={pathname === props.href}
      >
        {props.children}
      </NextLink>
    </Button>
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
          <UserAvatar user={user} />
          <ChevronDownIcon className="size-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="max-w-60 truncate">
          {user.showName}
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <NextLink href={`/user/${user.id}`}>
            <UserIcon />
            โปรไฟล์
          </NextLink>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={logout}
          className="text-destructive focus:text-destructive"
        >
          <ArrowRightStartOnRectangleIcon />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
