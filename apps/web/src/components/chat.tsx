import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import { Children, ReactElement, cloneElement, memo } from 'react'
import { useForm } from 'react-hook-form'
import { IoChatbubbleEllipses, IoSend } from 'react-icons/io5'

import { XMarkIcon } from '@heroicons/react/24/solid'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useIntersectionObserver } from '@uidotdev/usehooks'
import dayjs from 'dayjs'
import NextLink from 'next/link'
import { z } from 'zod'

import { ChatMessage } from '@otog/contract'
import { Button } from '@otog/ui/button'
import {
  Dialog,
  DialogContent,
  DialogPrimitive,
  DialogTitle,
  DialogTrigger,
} from '@otog/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@otog/ui/form'
import { Input } from '@otog/ui/input'
import { Link } from '@otog/ui/link'
import { Popover, PopoverContent, PopoverTrigger } from '@otog/ui/popover'
import { Spinner } from '@otog/ui/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipPrimitive,
  TooltipTrigger,
} from '@otog/ui/tooltip'
import { clsx } from '@otog/ui/utils'

import { chatKey, chatQuery, userKey } from '../api/query'
import { useSocketContext } from '../context/socket-context'
import { useUserContext } from '../context/user-context'
import { environment } from '../env'
import { UserAvatar } from './user-avatar'

const ChatForm = z.object({
  message: z.string().min(1, ' ').max(150, 'มีความยาวเกินที่กำหนดไว้ (150)'),
})
type ChatForm = z.infer<typeof ChatForm>

export function Chat() {
  if (environment.OFFLINE_MODE) return null
  const [open, setOpen] = useState(false)
  const { isAuthenticated } = useUserContext()

  const {
    emitChat,
    messages,
    newMessages,
    fetchNextPage,
    hasNextPage,
    hasUnread,
  } = useChat(open)

  const [ref, entry] = useIntersectionObserver({
    threshold: 0,
    root: null,
    rootMargin: '0px',
  })
  const isIntersecting = entry?.isIntersecting
  useEffect(() => {
    if (isIntersecting) {
      fetchNextPage()
    }
  }, [isIntersecting])

  const form = useForm({
    defaultValues: { message: '' },
    resolver: zodResolver(ChatForm),
  })
  const onSubmit = form.handleSubmit((values) => {
    emitChat?.(values.message)
    form.reset()
  })

  if (!isAuthenticated) return null
  return (
    <aside className="fixed bottom-4 right-4 z-30" aria-label="แชท">
      {hasUnread && (
        <div className="absolute right-1 top-1 size-2 rounded-full bg-orange-500" />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <OnlineUsersTooltip align="end" enabled={!open}>
          <PopoverTrigger asChild>
            <Button
              className="rounded-full text-2xl text-gray-600 size-12 [&>svg]:size-6"
              variant="outline"
              size="icon"
              aria-label="แชท"
            >
              <IoChatbubbleEllipses />
            </Button>
          </PopoverTrigger>
        </OnlineUsersTooltip>
        <PopoverContent
          className="fixed -bottom-16 -right-6 rounded-b-none h-[420px] w-[320px] flex flex-col p-0 border-none"
          sideOffset={0}
          side="top"
          onInteractOutside={(ev) => ev.preventDefault()}
        >
          <OnlineUsersTooltip align="start">
            <Button className="justify-between rounded-b-none p-0" asChild>
              <div>
                <OnlineUsersDialog>
                  <Button
                    variant="link"
                    className="text-inherit underline-offset-4 hover:underline p-4"
                  >
                    OTOG Chat
                  </Button>
                </OnlineUsersDialog>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  aria-label="ปิด"
                  className="flex-1 size-4 hover:bg-transparent hover:text-inherit justify-end h-full p-4"
                >
                  <XMarkIcon />
                </Button>
              </div>
            </Button>
          </OnlineUsersTooltip>

          <section
            className="flex flex-1 flex-col-reverse overflow-y-auto overflow-x-hidden border-x px-2"
            aria-label="ข้อความ"
            role="feed"
          >
            <div className="flex flex-col">
              {newMessages.map((message, index) => (
                <ChatMessageDisplay
                  key={message.id}
                  messageAbove={
                    index === 0 ? messages?.[0] : newMessages[index - 1]
                  }
                  messageData={message}
                  messageBelow={newMessages[index + 1]}
                />
              ))}
            </div>
            <div className="flex flex-col-reverse">
              {messages?.map((message, index) => (
                <ChatMessageDisplay
                  key={message.id}
                  messageAbove={messages[index + 1]}
                  messageData={message}
                  messageBelow={
                    index === 0 ? newMessages[0] : messages[index - 1]
                  }
                />
              ))}
            </div>
            {hasNextPage && (
              <div className="flex justify-center py-2" ref={ref}>
                <Spinner />
              </div>
            )}
          </section>
          <Form {...form}>
            <form className="flex gap-1 p-2 border-x" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="ส่งข้อความ..."
                        className="rounded-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="text-gray-500 dark:text-gray-300 rounded-full shrink-0"
                aria-label="ส่งข้อความ"
                size="icon"
                variant="ghost"
                type="submit"
              >
                <IoSend />
              </Button>
            </form>
          </Form>
        </PopoverContent>
      </Popover>
    </aside>
  )
}

const MAX_LENGTH = 15
const OnlineUsersTooltip = forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> & {
    align: 'start' | 'end'
    enabled?: boolean
  }
>(function OnlineUsersTooltip({ children, align, enabled = true }, ref) {
  const onlineUsersQuery = useQuery(userKey.getOnlineUsers())
  const onlineUsers =
    onlineUsersQuery.data?.status === 200 ? onlineUsersQuery.data.body : []
  if (!enabled || onlineUsers.length === 0) {
    return children
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild ref={ref}>
        {children}
      </TooltipTrigger>
      <TooltipContent
        className="flex flex-col justify-start z-30"
        align={align}
      >
        <p className="sr-only">ผู้ที่ออนไลน์</p>
        {onlineUsers.slice(0, MAX_LENGTH).map((user) => (
          <ul key={user.id} className="flex flex-col justify-start">
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <p className="line-clamp-3 max-w-[275px]">{user.showName}</p>
            </li>
          </ul>
        ))}
        {onlineUsers.length > MAX_LENGTH && (
          <>
            <div className="flex gap-2">
              <div>...ทั้งหมด {onlineUsers.length} คน</div>
            </div>
          </>
        )}
      </TooltipContent>
    </Tooltip>
  )
})

const OnlineUsersDialog = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger> & {}
>(function OnlineUsersTooltip({ children }, ref) {
  const onlineUsersQuery = useQuery(userKey.getOnlineUsers())
  const onlineUsers =
    onlineUsersQuery.data?.status === 200 ? onlineUsersQuery.data.body : []
  if (onlineUsers.length === 0) {
    return children
  }
  return (
    <Dialog>
      <DialogTrigger asChild ref={ref}>
        {children}
      </DialogTrigger>
      <DialogContent className="flex flex-col justify-start max-w-sm">
        <DialogTitle>ผู้ที่ออนไลน์ ({onlineUsers.length})</DialogTitle>
        {onlineUsers.map((user) => (
          <ul key={user.id} className="flex flex-col justify-start">
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <Link
                asChild
                variant="hidden"
                className="line-clamp-3 max-w-[275px] items-center flex gap-2"
              >
                <NextLink href={`/user/${user.id}`}>
                  <UserAvatar user={user} />
                  {user.showName}
                </NextLink>
              </Link>
            </li>
          </ul>
        ))}
      </DialogContent>
    </Dialog>
  )
})

interface ChatMessageProps {
  messageAbove: ChatMessage | undefined
  messageData: ChatMessage
  messageBelow: ChatMessage | undefined
}

const ChatMessageDisplay = memo(
  (props: ChatMessageProps) => {
    const {
      messageAbove,
      messageData: { message, user: sender, creationDate },
      messageBelow,
    } = props

    const { user } = useUserContext()
    const isSelf = user?.id === sender.id
    const isOther = !isSelf
    const shouldDisplayDate =
      !messageAbove ||
      new Date(messageAbove.creationDate).getDay() !==
        new Date(creationDate).getDay()
    const groupedWithTop =
      !shouldDisplayDate && messageAbove?.user.id === sender.id
    const isSameDateAsBelow =
      !!messageBelow &&
      new Date(messageBelow.creationDate).getDay() ===
        new Date(creationDate).getDay()
    const groupedWithBottom =
      isSameDateAsBelow && messageBelow?.user.id === sender.id
    const displayName = isOther && !groupedWithTop
    const displayAvatar = isOther && !groupedWithBottom
    const isEmoji = emojiPattern.test(message) && message.length <= 12

    return (
      <div>
        {shouldDisplayDate && (
          <div className="mt-2 flex justify-center text-xs text-gray-500">
            {new Date(creationDate).toLocaleDateString('th-TH', {
              minute: '2-digit',
              hour: '2-digit',
              day: 'numeric',
              month: 'short',
            })}
          </div>
        )}
        <div
          className={clsx(
            'flex items-end',
            isOther ? 'flex-row' : 'flex-row-reverse',
            groupedWithTop ? 'mt-0.5' : 'mt-2'
          )}
        >
          {displayAvatar ? (
            <SmallAvatar user={sender} />
          ) : (
            isOther && <div className="mr-1 min-w-6" />
          )}
          <div className="flex flex-col items-start">
            {displayName && (
              <NextLink
                href={`/user/${sender.id}`}
                className="mb-0.5 ml-1 line-clamp-3 max-w-[270px] px-1 text-xs text-gray-500"
              >
                {sender.showName}
              </NextLink>
            )}
            {isEmoji ? (
              <div
                title={dayjs(creationDate).format('DD/MM/BBBB HH:mm:ss')}
                className={clsx(
                  'whitespace-pre-wrap text-4xl word-break',
                  isSelf ? 'ml-7' : 'mr-7'
                )}
              >
                {message}
              </div>
            ) : (
              <div
                title={dayjs(creationDate).format('DD/MM/BBBB HH:mm:ss')}
                className={clsx(
                  'whitespace-pre-wrap rounded-2xl border px-2 py-1 word-break',
                  isSelf
                    ? 'ml-7 border-orange-400 bg-orange-400 text-white'
                    : 'mr-7 ',
                  groupedWithTop &&
                    (isSelf ? 'rounded-tr-md' : 'rounded-tl-md'),
                  groupedWithBottom &&
                    (isSelf ? 'rounded-br-md' : 'rounded-bl-md')
                )}
              >
                {formatParser(message)}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  },
  (prevProps, nextProps) =>
    prevProps.messageAbove?.id === nextProps.messageAbove?.id &&
    prevProps.messageData.id === nextProps.messageData.id &&
    prevProps.messageBelow?.id === nextProps.messageBelow?.id
)

export const emojiPattern =
  /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])+$/

const SmallAvatar = ({ user }: { user: { id: number; showName: string } }) => {
  return (
    <NextLink href={`/user/${user.id}`} className="mr-1">
      <UserAvatar user={user} />
    </NextLink>
  )
}

const MessageCode = (token: string) => (
  <code className="bg-transparent text-inherit dark:bg-alpha-black-300">
    {token}
  </code>
)

const matcher: Record<
  string,
  { match: string; formatter: (token: string) => ReactElement }
> = {
  _: { match: '_', formatter: (token) => <i>{token}</i> },
  '~': { match: '~', formatter: (token) => <s>{token}</s> },
  '*': { match: '*', formatter: (token) => <b>{token}</b> },
  '`': {
    match: '`',
    formatter: MessageCode,
  },
  '[': {
    match: ']',
    formatter: (token) => (
      <Link href={token} isExternal className="!text-inherit underline">
        {token}
      </Link>
    ),
  },
}

const formatted = (token: string, format: string) => {
  return matcher[format]?.formatter(token) ?? <>{token}</>
}

const formatParser = (message: string) => {
  const tokens: ReactElement[] = []
  let token = ''
  let format = ''
  for (let i = 0; i < message.length; i++) {
    const character = message[i]!
    if (format && matcher[format]?.match === character) {
      tokens.push(formatted(token.slice(1), format))
      format = ''
      token = ''
    } else if (!format && character in matcher) {
      tokens.push(<>{token}</>)
      format = character
      token = character
    } else {
      token += character
    }
  }
  if (token) {
    tokens.push(<>{token}</>)
  }
  return Children.map(tokens, (child, index) =>
    cloneElement(child, { key: index })
  )
}

const useLoadChat = () => {
  const { isAuthenticated } = useUserContext()
  const { data, isLoading, isError, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: chatKey.getChats._def,
      // TODO: https://github.com/lukemorales/query-key-factory/issues/89
      queryFn: ({ pageParam }) =>
        chatQuery.getChats.query({
          query: { offset: pageParam },
        }),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.status === 200 ? lastPage.body.at(-1)?.id : undefined,
      enabled: isAuthenticated,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })
  const messages = useMemo(
    () =>
      data?.pages.flatMap((page) => (page.status === 200 ? page.body : [])) ??
      [],
    [data]
  )

  return { messages, fetchNextPage, hasNextPage, isLoading, isError }
}

export type SocketMessage = [
  id: number,
  message: string,
  creationDate: string,
  user: [id: number, showName: string, rating: number],
]

type ChatSocketState = {
  emitMessage?: (message: string) => void
  newMessages: ChatMessage[]
  hasUnread: boolean
}

type ChatSocketAction =
  | { type: 'start' }
  | {
      type: 'new-message'
      payload: {
        message: SocketMessage
        isOpen: boolean
      }
    }
  | { type: 'read' }
  | { type: 'clear' }

export const useChatSocket = () => {
  const { socket } = useSocketContext()
  const queryClient = useQueryClient()
  const reducer = useCallback(
    (state: ChatSocketState, action: ChatSocketAction): ChatSocketState => {
      switch (action.type) {
        case 'start': {
          socket?.on('online', () => {
            queryClient.invalidateQueries({
              queryKey: userKey.getOnlineUsers._def,
            })
          })
          const emitMessage = (message: string) => {
            socket?.emit('chat-server', message)
          }
          return { ...state, emitMessage }
        }
        case 'new-message': {
          const [id, message, creationDate, [userId, showName, rating]] =
            action.payload.message
          state.newMessages.push({
            id,
            message,
            creationDate: creationDate as unknown as Date, // TODO fix this
            user: { id: userId, showName, rating },
          })
          return { ...state, hasUnread: !action.payload.isOpen }
        }
        case 'read': {
          return { ...state, hasUnread: false }
        }
        case 'clear': {
          return { newMessages: [], hasUnread: false }
        }
        default: {
          return state
        }
      }
    },
    [socket]
  )
  return useReducer(reducer, { newMessages: [], hasUnread: false })
}

const useChat = (isOpen: boolean) => {
  const [{ emitMessage: emitChat, newMessages, hasUnread }, dispatch] =
    useChatSocket()
  const { socket } = useSocketContext()
  const { isAuthenticated } = useUserContext()
  useEffect(() => {
    if (!socket) return
    if (isAuthenticated) {
      dispatch({ type: 'start' })
    } else {
      dispatch({ type: 'clear' })
    }
  }, [socket, dispatch, isAuthenticated])

  useEffect(() => {
    if (!socket) return
    socket.on('chat', (message: SocketMessage) => {
      dispatch({ type: 'new-message', payload: { message, isOpen } })
    })
    return () => {
      socket.off('chat')
    }
  }, [socket, isOpen, dispatch])

  useEffect(() => {
    if (isOpen && hasUnread) {
      dispatch({ type: 'read' })
    }
  }, [isOpen, hasUnread, dispatch])

  const oldChat = useLoadChat()

  return { emitChat, newMessages, hasUnread, ...oldChat }
}
