import { ForwardedRef, useEffect, useRef } from 'react'

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
import { Button, ButtonProps, Link } from '@otog/ui'

import Logo from '../../public/logo512.png'
import { useUserContext } from '../context/user-context'
// import { Avatar } from '../Avatar'
// import { ToggleColorModeButton } from '../ToggleColorModeButton'
import { environment } from '../env'
import { ThemeToggle } from './theme-provider'

export const Navbar = () => {
  const { isAuthenticated, logout } = useUserContext()
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
          <div className="flex gap-4">
            <ThemeToggle />
            {isAuthenticated && (
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
