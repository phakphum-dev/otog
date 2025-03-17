import React from 'react'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Head from 'next/head'
import NextLink from 'next/link'

import { ContestSchema } from '@otog/contract'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@otog/ui/breadcrumb'
import { Button } from '@otog/ui/button'
import { Separator } from '@otog/ui/separator'
import { SidebarTrigger } from '@otog/ui/sidebar'

import { announcementKey, announcementQuery } from '../../../api/query'
import { withQuery } from '../../../api/server'
import { Footer } from '../../../components/footer'
import { useUserContext } from '../../../context/user-context'
import { AnnouncementEditable } from '../../../modules/announcement/editor'
import { ReadonlyEditor } from '../../../modules/announcement/readonly-editor'
import { createEmptyAnnouncement } from '../../../modules/announcement/utils'
import { ContestLayout } from '../../../modules/contest/sidebar'

interface ContestAnnouncementPageProps {
  contestId: string
  contest: ContestSchema
  serverTime: string
}

export const getServerSideProps = withQuery<ContestAnnouncementPageProps>(
  async ({ context, query }) => {
    const contestId = context.query.contestId as string
    if (Number.isNaN(parseInt(contestId))) {
      return { notFound: true }
    }
    const [getTime, getContest] = await Promise.all([
      query.app.time.query(),
      query.contest.getContest.query({
        params: { contestId: contestId },
      }),
    ])
    if (getTime.status !== 200 || getContest.status !== 200) {
      throw new Error('Failed to fetch data')
    }
    return {
      props: {
        contestId,
        contest: getContest.body,
        serverTime: getTime.body.toString(),
      },
    }
  }
)

export default function ContestAnnouncementPage(
  props: ContestAnnouncementPageProps
) {
  return (
    <ContestLayout {...props}>
      <Head>
        <title>{props.contest.name} - Announcement | OTOG</title>
      </Head>
      <ContestAnnouncement {...props} />
      <Footer className="pt-8 px-4 max-w-full" />
    </ContestLayout>
  )
}
ContestAnnouncementPage.footer = false

function ContestAnnouncement(props: ContestAnnouncementPageProps) {
  const { contest } = props

  const { isAdmin } = useUserContext()
  const getAnnouncements = useQuery(
    announcementKey.getAnnouncements({
      query: { show: !isAdmin, contestId: contest.id.toString() },
    })
  )
  const announcements =
    getAnnouncements.data?.status === 200 ? getAnnouncements.data.body : []
  const queryClient = useQueryClient()
  const onCreate = async () => {
    try {
      await announcementQuery.createAnnouncement.mutation({
        body: { value: JSON.stringify(createEmptyAnnouncement()) },
        query: { contestId: contest.id.toString() },
      })
      queryClient.invalidateQueries({
        queryKey: announcementKey.getAnnouncements._def,
      })
    } catch (e) {
      // onErrorToast(e)
    }
  }

  return (
    <div className="flex-1">
      <div className="flex gap-2 items-center p-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbLink
              className="font-heading text-lg font-semibold hidden md:block"
              asChild
            >
              <NextLink href={`/contest/${contest.id}`}>
                {contest.name}
              </NextLink>
            </BreadcrumbLink>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-heading text-lg font-semibold">
                Announcement
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-4 px-4">
        {isAdmin && (
          <Button onClick={onCreate} variant="secondary" className="ml-auto">
            <PlusIcon />
            เพิ่มประกาศ
          </Button>
        )}
        {announcements.map((announcement) => (
          <>
            {isAdmin ? (
              <AnnouncementEditable
                announcement={announcement}
                key={announcement.id}
              />
            ) : (
              <div className="border-b last:border-b-0">
                <ReadonlyEditor
                  value={JSON.parse(announcement.value)}
                  key={announcement.id}
                />
              </div>
            )}
          </>
        ))}
      </div>
    </div>
  )
}
