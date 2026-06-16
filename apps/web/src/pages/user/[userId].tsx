import { useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

import { UserProfile } from '@otog/contract'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@otog/ui/tabs'
import { Switch } from '@otog/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@otog/ui/select'
import { Badge } from '@otog/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@otog/ui/table'
import { Link } from '@otog/ui/link'
import { DialogTrigger } from '@otog/ui/dialog'

import { submissionKey, submissionQuery, userKey, userQuery } from '../../api/query'
import { withQuery } from '../../api/server'
import { AvatarUpload } from '../../components/avatar-upload'
import { SubmissionTable } from '../../components/submission-table'
import { UserAvatar } from '../../components/user-avatar'
import { useUserContext } from '../../context/user-context'
import { SubmissionDialog } from '../../components/submission-dialog'

interface ProfilePageProps {
  userProfile: UserProfile
}

export const getServerSideProps = withQuery<ProfilePageProps>(
  async ({ context, query }) => {
    const userId = Number.parseInt(context.query?.userId as string)
    if (!Number.isInteger(userId)) {
      return { notFound: true }
    }
    const userProfile = await query.user.getUserProfile.query({
      params: { userId: userId.toString() },
    })
    if (userProfile.status === 404) {
      return { notFound: true }
    }
    if (userProfile.status !== 200) {
      throw userProfile
    }
    return {
      props: {
        userProfile: userProfile.body,
      },
    }
  }
)

export default function ProfilePage(props: ProfilePageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAdmin } = useUserContext()
  const [showInLeaderboard, setShowInLeaderboard] = useState(
    props.userProfile.showInLeaderboard
  )
  const updateVisibility = userQuery.updateLeaderboardVisibility.useMutation()

  const handleToggleVisibility = async (checked: boolean) => {
    setShowInLeaderboard(checked)
    try {
      await updateVisibility.mutateAsync({
        params: { userId: props.userProfile.id.toString() },
        body: { showInLeaderboard: checked },
      })
      toast.success('อัปเดตการแสดงตัวตนสำเร็จ')
      queryClient.invalidateQueries({
        queryKey: userKey.getLeaderboard._def,
      })
      queryClient.invalidateQueries({
        queryKey: userKey.getUserProfile({
          params: { userId: props.userProfile.id.toString() },
        }).queryKey,
      })
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาดในการอัปเดต')
      setShowInLeaderboard(!checked)
    }
  }

  const activeTab = (router.query.tab as string) || 'submissions'
  const handleTabChange = (val: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: val },
      },
      undefined,
      { shallow: true }
    )
  }

  return (
    <main className="container flex flex-col gap-6 flex-1 py-8" id="content">
      <section className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-semibold">
          {props.userProfile.showName}
        </h1>
        <div className="flex flex-col gap-8 md:flex-row items-center sm:items-start">
          <div className="relative group size-80 rounded-md overflow-hidden shadow-sm">
            <UserAvatar
              user={props.userProfile}
              className="size-80 rounded-md"
              size="default"
            />
            {user?.id === props.userProfile.id && (
              <AvatarUpload userId={props.userProfile.id} />
            )}
          </div>
          {/* <Graph userContest={userData!.attendedContest} /> */}

          <div className="flex flex-col gap-4 justify-center">
            {props.userProfile.rating !== null && (
              <div className="text-muted-foreground">
                เรตติ้ง: <span className="font-bold text-primary">{props.userProfile.rating}</span>
              </div>
            )}
            {user?.id === props.userProfile.id && (
              <div className="flex flex-col gap-3 max-w-sm mt-2">
                <div className="flex items-center gap-3 border p-4 rounded-xl bg-card shadow-sm">
                  <Switch
                    id="show-in-leaderboard"
                    checked={showInLeaderboard}
                    onCheckedChange={handleToggleVisibility}
                    disabled={updateVisibility.isPending}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="show-in-leaderboard"
                      className="text-sm font-semibold leading-none cursor-pointer"
                    >
                      แสดงตัวตนในตารางอันดับ
                    </label>
                    <p className="text-xs text-muted-foreground">
                      หากปิด คุณจะไม่ปรากฏในตารางอันดับ
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        {(props.userProfile.role === 'user' || isAdmin) && (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="justify-start relative h-auto w-full gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border mb-4">
              <TabsTrigger
                value="submissions"
                className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
              >
                ผลตรวจ
              </TabsTrigger>
              <TabsTrigger
                value="passed"
                className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
              >
                ข้อที่ผ่าน
              </TabsTrigger>
            </TabsList>
            <TabsContent value="submissions">
              <UserSubmissionTable userId={props.userProfile.id} />
            </TabsContent>
            <TabsContent value="passed">
              <UserPassedProblems userId={props.userProfile.id} />
            </TabsContent>
          </Tabs>
        )}
      </section>
    </main>
  )
}

interface UserSubmissionTableProps {
  userId: number
}

function UserSubmissionTable(props: UserSubmissionTableProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: submissionKey.getSubmissionsByUserId({
        params: { userId: props.userId.toString() },
      }).queryKey,
      // TODO: https://github.com/lukemorales/query-key-factory/issues/89
      queryFn: ({ pageParam }) =>
        submissionQuery.getSubmissionsByUserId.query({
          query: { offset: pageParam },
          params: { userId: props.userId.toString() },
        }),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.status === 200 ? lastPage.body.at(-1)?.id : undefined,
    })
  const submissions = useMemo(
    () =>
      data?.pages.flatMap((page) => (page.status === 200 ? page.body : [])) ??
      [],
    [data]
  )

  return (
    <SubmissionTable
      data={submissions}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
    />
  )
}

function UserPassedProblems({ userId }: { userId: number }) {
  const { user, isAdmin } = useUserContext()
  const [sortBy, setSortBy] = useState<'solvedDate' | 'id'>('solvedDate')

  const getPassedProblems = useQuery({
    ...userKey.getPassedProblems({
      params: { userId: userId.toString() },
      query: { sortBy },
    }),
  })

  const problems = useMemo(
    () =>
      getPassedProblems.data?.status === 200
        ? getPassedProblems.data.body
        : [],
    [getPassedProblems.data]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-muted-foreground">
          รายการข้อที่ผ่าน ({problems.length})
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">เรียงตาม:</span>
          <Select
            value={sortBy}
            onValueChange={(val) => setSortBy(val as 'solvedDate' | 'id')}
          >
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solvedDate">วันที่ผ่านล่าสุด</SelectItem>
              <SelectItem value="id">เลขข้อ (ID)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">เลขข้อ</TableHead>
              <TableHead>ชื่อโจทย์</TableHead>
              <TableHead className="text-end pr-6">คะแนน</TableHead>
              <TableHead className="text-end pr-6">วันที่ผ่าน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getPassedProblems.isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : problems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  ไม่มีข้อที่ผ่าน
                </TableCell>
              </TableRow>
            ) : (
              problems.map((prob) => (
                <TableRow key={prob.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    #{prob.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/api/problem/${prob.id}`}
                      isExternal
                      className={!prob.show ? 'text-muted-foreground' : undefined}
                    >
                      {prob.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-end pr-6">
                    {user?.id === userId || isAdmin ? (
                      <SubmissionDialog submissionId={prob.submissionId}>
                        <Badge variant="accept" asChild>
                          <DialogTrigger className="cursor-pointer hover:opacity-80 transition-opacity">
                            {prob.score} / {prob.score}
                          </DialogTrigger>
                        </Badge>
                      </SubmissionDialog>
                    ) : (
                      <Badge variant="accept">
                        {prob.score} / {prob.score}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-end pr-6 font-mono text-muted-foreground text-xs">
                    {dayjs(prob.solvedDate).format('DD/MM/YYYY HH:mm')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
