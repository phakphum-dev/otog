import { ReactNode, useEffect, useState } from 'react'

import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { Bars3Icon } from '@heroicons/react/24/solid'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@otog/ui/sheet'
import { clsx } from '@otog/ui/utils'

import Logo from '../../public/logo512.png'
import { useUserContext } from '../context/user-context'
import { Search } from './search'
import { ThemeToggle } from './theme-provider'
import { UserAvatar } from './user-avatar'

export const Navbar = () => {
  const { user } = useUserContext()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  useEffect(() => {
    function closeSheet() {
      setOpen(false)
    }
    router.events.on('routeChangeStart', closeSheet)
    return () => {
      router.events.off('routeChangeStart', closeSheet)
    }
  }, [router])
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
            <ul className="flex gap-2 items-center max-lg:hidden">
              <li>
                <NavButton href="/problem" className="ml-6">
                  โจทย์
                </NavButton>
              </li>
              <li>
                <NavButton href="/submission">ผลตรวจ</NavButton>
              </li>
              <li>
                <NavButton href="/contest">แข่งขัน</NavButton>
              </li>
            </ul>
          </div>
          <div className="flex gap-2 max-lg:hidden">
            <Search />
            <ThemeToggle />
            {user ? (
              <Menu user={user} />
            ) : (
              <Button asChild variant="ghost">
                <NextLink href="/login">เข้าสู่ระบบ</NextLink>
              </Button>
            )}
          </div>
          <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Bars3Icon />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col gap-6">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription className="" />
                </SheetHeader>
                <ul className="flex flex-col gap-2">
                  <li>
                    <NavButton className="block" href="/problem">
                      โจทย์
                    </NavButton>
                  </li>
                  <li>
                    <NavButton className="block" href="/submission">
                      ผลตรวจ
                    </NavButton>
                  </li>
                  <li>
                    <NavButton className="block" href="/contest">
                      แข่งขัน
                    </NavButton>
                  </li>
                </ul>
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
              </SheetContent>
            </Sheet>
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
  const { logout, isAdmin } = useUserContext()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <UserAvatar user={user} />
          <ChevronDownIcon className="size-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <NextLink href="/admin" className="max-w-60 truncate font-semibold">
              {user.showName}
            </NextLink>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuLabel className="max-w-60 truncate">
            {user.showName}
          </DropdownMenuLabel>
        )}
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
