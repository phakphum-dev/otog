import { initContract } from '@ts-rest/core'
import { z } from 'zod'

import {
  AnnouncementModel,
  ChatModel,
  ContestModel,
  ContestProblemModel,
  ProblemModel,
  SubmissionModel,
  SubmissionStatus,
  UserContestModel,
  UserModel,
} from '@otog/database'

// TODO: https://github.com/colinhacks/zod/discussions/2171

export const contract: ReturnType<typeof initContract> = initContract()

export const announcementRouter = contract.router(
  {
    getAnnouncements: {
      method: 'GET',
      path: '',
      responses: {
        200: z.array(AnnouncementModel),
      },
      summary: 'Get all announcements',
    },
    createAnnouncement: {
      method: 'POST',
      path: '',
      body: AnnouncementModel.pick({ value: true }),
      responses: {
        201: AnnouncementModel,
        400: z.object({ message: z.string() }),
      },
      summary: 'Create an announcement',
    },
    getContestAnnouncments: {
      method: 'GET',
      path: '/contest/:contestId',
      responses: {
        200: z.array(AnnouncementModel),
      },
      summary: 'Get contest announcements',
    },
    createContestAnnouncement: {
      method: 'POST',
      path: '/contest/:contestId',
      body: AnnouncementModel.pick({ value: true }),
      responses: {
        201: AnnouncementModel,
        400: z.object({ message: z.string() }),
      },
      summary: 'Create an announcement in a contest',
    },
    deleteAnnouncement: {
      method: 'DELETE',
      path: '/:announcementId',
      body: null,
      responses: {
        200: AnnouncementModel,
      },
      summary: 'Delete an announcement',
    },
    showAnnouncement: {
      method: 'PATCH',
      path: '/:announcementId',
      body: AnnouncementModel.pick({ show: true }),
      responses: {
        200: AnnouncementModel,
      },
      summary: 'Toggle show of an announcement',
    },
    updateAnnouncement: {
      method: 'PUT',
      path: '/:announcementId',
      body: AnnouncementModel.omit({ id: true }),
      responses: {
        200: AnnouncementModel,
      },
      summary: 'Update an announcement',
    },
  },
  { pathPrefix: '/announcement' }
)

const PaginationQuerySchema = z.object({
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
})

export const chatRouter = contract.router({
  getChats: {
    method: 'GET',
    path: '/chat',
    responses: {
      200: z.array(ChatModel),
    },
    query: PaginationQuerySchema,
    summary: 'Get paginated chats',
  },
})

const UserWithourPasswordSchema = UserModel.pick({
  id: true,
  username: true,
  showName: true,
  role: true,
  rating: true,
})

const SubmissionWithoutSourceCodeSchema = SubmissionModel.pick({
  id: true,
  result: true,
  score: true,
  timeUsed: true,
  status: true,
  errmsg: true,
  contestId: true,
  language: true,
  creationDate: true,
  public: true,
})
  .extend({
    problem: ProblemModel.pick({
      id: true,
      name: true,
    }).nullable(),
  })
  .extend({
    user: UserWithourPasswordSchema.nullable(),
  })

const SubmissionWithSourceCodeSchema = SubmissionWithoutSourceCodeSchema.merge(
  SubmissionModel.pick({ sourceCode: true })
)

export const submissionRouter = contract.router(
  {
    getSubmissions: {
      method: 'GET',
      path: '',
      responses: {
        200: z.array(SubmissionWithoutSourceCodeSchema),
      },
      query: PaginationQuerySchema,
      summary: 'Get paginated submissions',
    },
    getContestSubmissions: {
      method: 'GET',
      path: '/contest',
      responses: {
        200: z.array(SubmissionWithoutSourceCodeSchema),
      },
      query: PaginationQuerySchema,
      summary: 'Get paginated contest submissions',
    },
    getLatestSubmissionByProblemId: {
      method: 'GET',
      path: '/problem/:problemId/latest',
      responses: {
        200: z.object({
          latestSubmission: SubmissionWithSourceCodeSchema.nullable(),
        }),
      },
      summary: 'Get latest submission for a problem',
    },
    uploadFile: {
      method: 'POST',
      path: '/problem/:problemId',
      contentType: 'multipart/form-data',
      responses: {
        200: SubmissionModel,
      },
      body: SubmissionModel.pick({
        language: true,
        contestId: true,
      }),
      summary: 'Submit code file',
    },
    getLatestSubmissionByUserId: {
      method: 'GET',
      path: '/latest',
      responses: {
        200: z.object({
          latestSubmission: SubmissionWithSourceCodeSchema.nullable(),
        }),
      },
      summary: 'Get latest submission for a user',
    },
    getSubmissionsByUserId: {
      method: 'GET',
      path: '/user/:userId',
      responses: {
        200: z.array(SubmissionWithoutSourceCodeSchema),
        400: z.object({ message: z.string() }),
      },
      query: PaginationQuerySchema,
      summary: 'Get submissions for a user',
    },
    getSubmission: {
      method: 'GET',
      path: '/:submissionId',
      responses: {
        200: SubmissionWithoutSourceCodeSchema,
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a submission without source code',
    },
    getSubmissionWithSourceCode: {
      method: 'GET',
      path: '/:submissionId/code',
      responses: {
        200: SubmissionWithSourceCodeSchema,
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a submission with source code',
    },
    shareSubmission: {
      method: 'PATCH',
      path: '/:submissionId/share',
      responses: {
        200: SubmissionModel.pick({ public: true }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      body: z.object({ show: z.boolean() }),
      summary: 'Toggle publicity of a submission',
    },
    rejudgeSubmission: {
      method: 'PATCH',
      path: '/:submissionId/rejudge',
      responses: {
        200: SubmissionWithoutSourceCodeSchema,
        404: z.object({ message: z.string() }),
      },
      body: null,
      summary: 'Rejudge a submission',
    },
    rejudgeProblem: {
      method: 'PATCH',
      path: '/problem/:problemId/rejudge',
      responses: {
        200: z.undefined(),
        404: z.object({ message: z.string() }),
      },
      body: null,
      summary: 'Rejudge all submissions of a problem',
    },
  },
  { pathPrefix: '/submission' }
)

export const userRouter = contract.router(
  {
    getUsers: {
      method: 'GET',
      path: '',
      responses: {
        200: z.array(UserWithourPasswordSchema),
      },
      summary: 'Get all users',
    },
    getOnlineUsers: {
      method: 'GET',
      path: '/online',
      responses: {
        200: z.array(UserWithourPasswordSchema),
      },
      summary: 'Get online users',
    },
    getUserProfile: {
      method: 'GET',
      path: '/:userId/profile',
      responses: {
        200: UserWithourPasswordSchema.extend({
          userContest: z.array(
            UserContestModel.pick({
              ratingAfterUpdate: true,
              rank: true,
            }).extend({
              contest: ContestModel.pick({
                id: true,
                name: true,
                timeStart: true,
              }),
            })
          ),
        }).nullable(),
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a user by id',
    },
    updateUser: {
      method: 'PUT',
      path: '/:userId',
      responses: {
        200: UserWithourPasswordSchema,
      },
      body: UserModel.omit({ id: true }),
      summary: 'Update user data',
    },
    updateShowName: {
      method: 'PATCH',
      path: '/:userId/name',
      responses: {
        200: UserModel.pick({ showName: true }),
        403: z.object({ message: z.string() }),
      },
      body: UserModel.pick({ showName: true }),
      summary: 'Update user show name',
    },
  },
  { pathPrefix: '/user' }
)

const PrizeSchema = z.object({
  id: z.number(),
  problem: ProblemModel.pick({ id: true }).nullable(),
  user: UserModel.pick({ id: true, showName: true }).nullable(),
})

export const contestRouter = contract.router(
  {
    getContests: {
      method: 'GET',
      path: '',
      responses: {
        200: z.array(ContestModel),
      },
      summary: 'Get all contests',
    },
    getCurrentContest: {
      method: 'GET',
      path: '/now',
      responses: {
        200: z.object({
          currentContest: ContestModel.nullable(),
        }),
      },
      summary: 'Get the current contest',
    },
    getContest: {
      method: 'GET',
      path: '/:contestId',
      responses: {
        200: ContestModel.nullable(),
      },
      summary: 'Get a contest',
    },
    getContestScoreboard: {
      method: 'GET',
      path: '/:contestId/scoreboard',
      responses: {
        200: z.object({
          contest: ContestModel.extend({
            userContest: z.array(UserContestModel),
            contestProblem: z.array(
              ContestProblemModel.extend({ problem: ProblemModel })
            ),
          }),
          userContest: z.array(
            UserContestModel.extend({
              submissions: z
                .array(
                  SubmissionModel.pick({
                    id: true,
                    problemId: true,
                    score: true,
                    timeUsed: true,
                    status: true,
                    userId: true,
                  })
                )
                .optional(),
            })
          ),
        }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a contest',
    },
    getContestPrize: {
      method: 'GET',
      path: '/:contestId/prize',
      responses: {
        200: z.object({
          firstBlood: z.array(PrizeSchema),
          fasterThanLight: z.array(PrizeSchema),
          passedInOne: z.array(PrizeSchema),
          oneManSolve: z.array(PrizeSchema),
        }),
      },
      summary: 'Get a contest prize',
    },
    createContest: {
      method: 'POST',
      path: '',
      responses: {
        200: ContestModel,
      },
      body: ContestModel.omit({ id: true }),
      summary: 'Create a contest',
    },
    toggleProblemToContest: {
      method: 'PATCH',
      path: '/:contestId',
      responses: { 200: z.object({ show: z.boolean() }) },
      body: z.object({ show: z.boolean(), problemId: z.coerce.number() }),
      summary: 'Toggle problem to a contest',
    },
    updateContest: {
      method: 'PUT',
      path: '/:contestId',
      responses: {
        200: ContestModel,
      },
      body: ContestModel.omit({ id: true }),
      summary: 'Update a contest',
    },
    deleteContest: {
      method: 'DELETE',
      path: '/:contestId',
      body: null,
      responses: {
        200: ContestModel,
      },
      summary: 'Delete a contest',
    },
    contestSignUp: {
      method: 'POST',
      path: '/:contestId/signup',
      body: z.object({ userId: z.coerce.number() }),
      responses: {
        200: UserContestModel,
      },
      summary: 'Sign up for a contest',
    },
  },
  { pathPrefix: '/contest' }
)

const ProblemWithoutExampleSchema = ProblemModel.omit({ examples: true })
const LatestSubmissionModel = z.object({
  latestSubmissionId: z.number().nullable(),
  status: z.nativeEnum(SubmissionStatus).nullable(),
})
const PassedCountSchema = z.object({
  passedCount: z.number(),
})
const ProblemWithDetailSchema = ProblemWithoutExampleSchema.merge(
  LatestSubmissionModel
).merge(PassedCountSchema)
const PassedUserModel = UserModel.pick({
  id: true,
  role: true,
  username: true,
  showName: true,
  rating: true,
})

export const problemRouter = contract.router(
  {
    getProblems: {
      method: 'GET',
      path: '',
      responses: {
        200: z.array(
          z.union([
            ProblemWithDetailSchema,
            ProblemWithoutExampleSchema.merge(PassedCountSchema),
          ])
        ),
      },
      summary: 'Get problems',
    },
    getProblem: {
      method: 'GET',
      path: '/:problemId',
      responses: {
        200: ProblemWithoutExampleSchema,
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a problem',
    },
    getPassedUsers: {
      method: 'GET',
      path: '/:problemId/user',
      responses: {
        200: z.array(PassedUserModel),
      },
      summary: 'Get passed users',
    },
    getPdf: {
      method: 'GET',
      path: '/doc/:problemId',
      responses: { 200: z.string() },
      summary: 'Get a pdf document for a problem',
    },
    toggleShowProblem: {
      method: 'PATCH',
      path: '/:problemId',
      responses: {
        200: ProblemWithoutExampleSchema,
      },
      body: ProblemModel.pick({ show: true }),
      summary: 'Toggle problem show state',
    },
    createProblem: {
      method: 'POST',
      path: '',
      contentType: 'multipart/form-data',
      responses: {
        201: ProblemWithoutExampleSchema,
      },
      body: ProblemModel.omit({ id: true }),
      summary: 'Create a problem',
    },
    updateProblem: {
      method: 'PUT',
      path: '/:problemId',
      responses: {
        200: ProblemWithoutExampleSchema,
      },
      body: ProblemModel.omit({ id: true }),
      summary: 'Update a problem',
    },
    deleteProblem: {
      method: 'DELETE',
      path: '/:problemId',
      responses: {
        200: ProblemWithoutExampleSchema,
      },
      body: null,
      summary: 'Delete a problem',
    },
    updateProblemExamples: {
      method: 'PUT',
      path: '/:problemId/examples',
      responses: {
        200: ProblemModel.pick({ examples: true }),
      },
      body: z.any(),
      summary: 'Update problem example testcases',
    },
  },
  { pathPrefix: '/problem' }
)

export const authRouter = contract.router(
  {
    register: {
      method: 'POST',
      path: '/register',
      responses: {
        201: z.object({ message: z.string() }),
      },
      body: UserModel.pick({ username: true, showName: true, password: true }),
      summary: 'Register a user',
    },
    login: {
      method: 'POST',
      path: '/login',
      responses: {
        200: z.object({ message: z.string() }),
      },
      body: UserModel.pick({ username: true, password: true }),
      summary: 'Login and get tokens',
    },
    refreshToken: {
      method: 'GET',
      path: '/refresh/token',
      responses: {
        200: z.object({ message: z.string() }),
      },
      summary: 'Refresh access token',
    },
  },
  { pathPrefix: '/auth' }
)

export const appRouter = contract.router({
  time: {
    method: 'GET',
    path: '/time',
    responses: {
      200: z.date(),
    },
    summary: 'Get server time',
  },
  ping: {
    method: 'GET',
    path: '/ping',
    responses: {
      200: z.string(),
    },
    summary: 'Ping server',
  },
})

export const router = contract.router({
  app: appRouter,
  auth: authRouter,
  problem: problemRouter,
  user: userRouter,
  submission: submissionRouter,
  chat: chatRouter,
  announcement: announcementRouter,
})
