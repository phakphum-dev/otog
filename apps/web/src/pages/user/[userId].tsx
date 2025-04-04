import { useMemo } from 'react'

import { useInfiniteQuery } from '@tanstack/react-query'

import { UserProfile } from '@otog/contract'

import { submissionKey, submissionQuery } from '../../api/query'
import { withQuery } from '../../api/server'
import { AvatarUpload } from '../../components/avatar-upload'
import { SubmissionTable } from '../../components/submission-table'
import { UserAvatar } from '../../components/user-avatar'
import { useUserContext } from '../../context/user-context'

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
  const { user, isAdmin } = useUserContext()
  return (
    <main className="container flex flex-col gap-6 flex-1 py-8" id="content">
      <section className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-semibold">
          {props.userProfile.showName}
        </h1>
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="relative group size-80 rounded-md overflow-hidden">
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
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold">ผลตรวจ</h2>
        {(props.userProfile.role === 'user' || isAdmin) && (
          <UserSubmissionTable userId={props.userProfile.id} />
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
