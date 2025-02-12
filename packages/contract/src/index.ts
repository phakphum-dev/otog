import { initContract } from '@ts-rest/core'
import { File } from '@web-std/file'
import { z } from 'zod'

import {
  AnnouncementModel,
  ChatModel,
  ContestModel,
  ContestProblemModel,
  ProblemModel,
  SubmissionModel,
  SubmissionResultModel,
  SubtaskResultModel,
  UserContestModel,
  UserModel,
  VerdictModel,
} from '@otog/database'

// TODO: https://github.com/colinhacks/zod/discussions/2171

export const contract: ReturnType<typeof initContract> = initContract()

export const AnnouncementSchema = AnnouncementModel.extend({
  value: z.string(),
})
export type AnnouncementSchema = z.infer<typeof AnnouncementSchema>

export const UpdateAnnouncementSchema = AnnouncementSchema.omit({ id: true })
export type UpdateAnnouncementSchema = z.infer<typeof UpdateAnnouncementSchema>

export const announcementRouter = contract.router(
  {
    getAnnouncements: {
      method: 'GET',
      path: '',
      query: z.object({
        show: z.boolean().optional(),
        contestId: z.string().optional(),
      }),
      responses: {
        200: z.array(AnnouncementSchema),
        403: z.object({ message: z.string() }),
      },
      summary: 'Get all announcements',
    },
    createAnnouncement: {
      method: 'POST',
      path: '',
      query: z.object({
        contestId: z.string().optional(),
      }),
      body: z.object({ value: z.string() }),
      responses: {
        201: AnnouncementSchema,
        400: z.object({ message: z.string() }),
      },
      summary: 'Create an announcement',
    },
    deleteAnnouncement: {
      method: 'DELETE',
      path: '/:announcementId',
      body: null,
      responses: {
        200: AnnouncementSchema,
      },
      summary: 'Delete an announcement',
    },
    showAnnouncement: {
      method: 'PATCH',
      path: '/:announcementId',
      body: z.object({ show: z.boolean() }),
      responses: {
        200: AnnouncementSchema,
      },
      summary: 'Toggle show of an announcement',
    },
    updateAnnouncement: {
      method: 'PUT',
      path: '/:announcementId',
      body: UpdateAnnouncementSchema,
      responses: {
        200: AnnouncementSchema,
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
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

const ListPaginationQuerySchema = z.object({
  limit: z.coerce.number(),
  skip: z.coerce.number(),
  search: z.string().optional(),
})

export type ListPaginationQuerySchema = z.infer<
  typeof ListPaginationQuerySchema
>

export const ChatMessage = ChatModel.pick({
  id: true,
  creationDate: true,
  message: true,
}).extend({
  user: UserModel.pick({
    id: true,
    showName: true,
    rating: true,
  }),
})
export type ChatMessage = z.infer<typeof ChatMessage>

export const chatRouter = contract.router({
  getChats: {
    method: 'GET',
    path: '/chat',
    responses: {
      200: z.array(ChatMessage),
    },
    query: PaginationQuerySchema,
    summary: 'Get paginated chats',
  },
})

export const UserSchema = UserModel.pick({
  id: true,
  username: true,
  showName: true,
  role: true,
  rating: true,
})
export type UserSchema = z.infer<typeof UserSchema>

const SubmissionSchema = SubmissionModel.pick({
  id: true,
  status: true,
  contestId: true,
  language: true,
  creationDate: true,
  public: true,
  userId: true,
  memUsed: true,
}).extend({
  problem: ProblemModel.pick({
    id: true,
    name: true,
    memoryLimit: true,
    timeLimit: true,
    score: true,
  }),
  submissionResult: SubmissionResultModel.pick({
    id: true,
    score: true,
    result: true,
    timeUsed: true,
    memUsed: true,
  }).nullable(),
  user: UserSchema,
})
export type SubmissionSchema = z.infer<typeof SubmissionSchema>

export const SubmissionDetailSchema = SubmissionSchema.merge(
  SubmissionModel.pick({ sourceCode: true })
).extend({
  submissionResult: SubmissionResultModel.pick({
    id: true,
    score: true,
    result: true,
    timeUsed: true,
    memUsed: true,
    errmsg: true,
  })
    .extend({
      subtaskResults: z.array(
        SubtaskResultModel.pick({
          score: true,
          fullScore: true,
          subtaskIndex: true,
        }).extend({
          verdicts: z.array(VerdictModel),
        })
      ),
    })
    .nullable(),
})
export type SubmissionDetailSchema = z.infer<typeof SubmissionDetailSchema>

const FileSchema = z.instanceof(File)
type FileSchema = z.infer<typeof FileSchema>

const GetSubmissionsQuery = PaginationQuerySchema.extend({
  userId: z.number().optional(),
  problemSearch: z.string().optional(),
})
export type GetSubmissionsQuery = z.infer<typeof GetSubmissionsQuery>

export const submissionRouter = contract.router(
  {
    getSubmissions: {
      method: 'GET',
      path: '',
      responses: {
        200: z.array(SubmissionSchema),
      },
      query: GetSubmissionsQuery,
      summary: 'Get paginated submissions',
    },
    getContestSubmissions: {
      method: 'GET',
      path: '/contest',
      responses: {
        200: z.array(SubmissionSchema),
      },
      query: PaginationQuerySchema,
      summary: 'Get paginated contest submissions',
    },
    getLatestSubmissionByProblemId: {
      method: 'GET',
      path: '/problem/:problemId/latest',
      responses: {
        200: z.object({
          submission: SubmissionDetailSchema.nullable(),
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
      query: z.object({ contestId: z.string().nullish() }),
      body: contract.type<{
        sourceCode: FileSchema
        language: string
      }>(),
      summary: 'Submit code file',
    },
    getLatestSubmissionByUserId: {
      method: 'GET',
      path: '/latest',
      responses: {
        200: z.object({
          submission: SubmissionDetailSchema.nullable(),
        }),
      },
      summary: 'Get latest submission for a user',
    },
    getSubmissionsByUserId: {
      method: 'GET',
      path: '/user/:userId',
      responses: {
        200: z.array(SubmissionSchema),
        400: z.object({ message: z.string() }),
      },
      query: PaginationQuerySchema,
      summary: 'Get submissions for a user',
    },
    getSubmission: {
      method: 'GET',
      path: '/:submissionId',
      responses: {
        200: SubmissionSchema,
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a submission without source code',
    },
    getSubmissionWithSourceCode: {
      method: 'GET',
      path: '/:submissionId/code',
      responses: {
        200: SubmissionDetailSchema,
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
        200: SubmissionSchema,
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

export const UserProfile = UserSchema.extend({
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
})
export type UserProfile = z.infer<typeof UserProfile>

export const userRouter = contract.router(
  {
    getUsersForAdmin: {
      method: 'GET',
      path: '/admin/list',
      query: ListPaginationQuerySchema,
      responses: {
        200: z.object({
          data: z.array(UserSchema),
          total: z.number(),
        }),
      },
      summary: 'Get paginated users for admin',
    },
    getOnlineUsers: {
      method: 'GET',
      path: '/online',
      responses: {
        200: z.array(UserSchema),
      },
      summary: 'Get online users',
    },
    getUserProfile: {
      method: 'GET',
      path: '/:userId/profile',
      responses: {
        200: UserProfile,
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a user by id',
    },
    updateUser: {
      method: 'PUT',
      path: '/:userId',
      responses: {
        200: UserSchema,
      },
      body: UserModel.pick({
        username: true,
        showName: true,
        role: true,
        password: true,
      }),
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

export const ContestSchema = ContestModel.pick({
  id: true,
  name: true,
  mode: true,
  gradingMode: true,
  timeStart: true,
  timeEnd: true,
  announce: true,
})
export type ContestSchema = z.infer<typeof ContestSchema>

export const ContestDetailSchema = ContestSchema.extend({
  contestProblem: z.array(
    z.object({
      problem: ProblemModel.pick({
        id: true,
        name: true,
        score: true,
      }),
    })
  ),
})
export type ContestDetailSchema = z.infer<typeof ContestDetailSchema>

export const ContestStatusEnum = z.enum(['PENDING', 'RUNNING', 'FINISHED'])
export type ContestStatusEnum = z.infer<typeof ContestStatusEnum>

const PrizeSchema = z.object({
  id: z.number(),
  problem: ProblemModel.pick({ id: true }).nullable(),
  user: UserModel.pick({ id: true, showName: true }).nullable(),
})

export const ProblemResultSchema = z.object({
  problemId: z.number(),
  score: z.number(),
  penalty: z.number(),
})
export type ProblemResultSchema = z.infer<typeof ProblemResultSchema>

export const UserContestScoreboard = UserContestModel.extend({
  totalScore: z.number(),
  maxPenalty: z.number(),
  user: UserModel.pick({
    id: true,
    showName: true,
    role: true,
    rating: true,
  }),
  problemResults: z.array(ProblemResultSchema),
})
export type UserContestScoreboard = z.infer<typeof UserContestScoreboard>

export const ContestScoreboard = z.object({
  contest: ContestModel.extend({
    userContest: z.array(UserContestModel),
    contestProblem: z.array(
      ContestProblemModel.extend({ problem: ProblemModel })
    ),
  }),
  userContest: z.array(UserContestScoreboard),
})
export type ContestScoreboard = z.infer<typeof ContestScoreboard>

export const ContestPrize = z.object({
  firstBlood: z.array(PrizeSchema),
  // fasterThanLight: z.array(PrizeSchema),
  // passedInOne: z.array(PrizeSchema),
  oneManSolve: z.array(PrizeSchema),
})
export type ContestPrize = z.infer<typeof ContestPrize>

export const CurrentContest = ContestModel.extend({
  contestProblem: ContestProblemModel.extend({
    problem: ProblemModel,
  }).array(),
})
export type CurrentContest = z.infer<typeof CurrentContest>

export const AdminContestWithProblems = ContestModel.extend({
  contestProblem: ContestProblemModel.extend({
    problem: ProblemModel,
  }).array(),
})
export type AdminContestWithProblems = z.infer<typeof AdminContestWithProblems>

export const CursorPaginationQuerySchema = z.object({
  take: z.coerce.number(),
  cursor: z.coerce.number().optional(),
  search: z.string().optional(),
})
export type CursorPaginationQuerySchema = z.infer<
  typeof CursorPaginationQuerySchema
>
export const contestRouter = contract.router(
  {
    listContest: {
      method: 'GET',
      path: '/list',
      query: ListPaginationQuerySchema,
      responses: {
        200: z.object({
          data: z.array(ContestSchema),
          total: z.number(),
        }),
      },
      summary: 'List paginated contests',
    },
    getCurrentContests: {
      method: 'GET',
      path: '/now',
      responses: {
        200: z.array(ContestSchema),
      },
      summary: 'Get the current contests',
    },
    getContest: {
      method: 'GET',
      path: '/:contestId',
      responses: {
        200: ContestSchema,
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a contest',
    },
    getContestDetail: {
      method: 'GET',
      path: '/:contestId/detail',
      responses: {
        200: ContestDetailSchema,
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a contest with detail',
    },
    getContestProblem: {
      method: 'GET',
      path: '/:contestId/problem/:problemId',
      responses: {
        200: ProblemModel,
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a problem in contest',
    },
    getUserContestScores: {
      method: 'GET',
      path: '/:contestId/score',
      responses: {
        200: z.array(ProblemResultSchema),
      },
      summary: 'Get a problem in contest',
    },
    getContestScoreboard: {
      method: 'GET',
      path: '/:contestId/scoreboard',
      responses: {
        200: ContestScoreboard,
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      summary: 'Get a contest',
    },
    getContestPrize: {
      method: 'GET',
      path: '/:contestId/prize',
      responses: {
        200: ContestPrize,
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
    putProblemToContest: {
      method: 'PUT',
      path: '/:contestId/problems',
      responses: { 200: z.object({}) },
      body: z.array(z.object({ problemId: z.coerce.number() })),
      summary: 'Put problems to a contest',
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
    getContestsForAdmin: {
      method: 'GET',
      path: '/admin/list',
      query: ListPaginationQuerySchema,
      responses: {
        200: z.object({
          data: z.array(ContestModel),
          total: z.number(),
        }),
      },
      summary: 'List paginated contests for admin',
    },
    getContestForAdmin: {
      method: 'GET',
      path: '/admin/:contestId',
      responses: {
        200: AdminContestWithProblems,
      },
      summary: 'List paginated contests for admin',
    },
  },
  { pathPrefix: '/contest' }
)

const ProblemWithoutExampleSchema = ProblemModel.omit({ examples: true })
const LatestSubmissionModel = SubmissionModel.pick({
  id: true,
  status: true,
  userId: true,
  public: true,
})
export const ProblemTableRowSchema = ProblemWithoutExampleSchema.extend({
  passedCount: z.number(),
  // samplePassedUsers: z.array(UserModel.pick({ id: true, showName: true })),
  latestSubmission: LatestSubmissionModel.nullable(),
})
export type ProblemTableRowSchema = z.infer<typeof ProblemTableRowSchema>

export const PassedUserSchema = UserModel.pick({
  id: true,
  role: true,
  username: true,
  showName: true,
  rating: true,
}).extend({
  passedSubmission: LatestSubmissionModel,
})
export type PassedUserSchema = z.infer<typeof PassedUserSchema>

const AdminProblemSchema = ProblemModel.pick({
  id: true,
  name: true,
  sname: true,
  show: true,
  case: true,
  memoryLimit: true,
  timeLimit: true,
  recentShowTime: true,
  score: true,
})
export type AdminProblemSchema = z.infer<typeof AdminProblemSchema>

export const ProblemFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  sname: z.string().min(1, 'Required'),
  score: z.string().min(1, 'Required').pipe(z.coerce.number()),
  timeLimit: z
    .string()
    .min(1, 'Required')
    .pipe(z.coerce.number())
    .transform((v) => v * 1000),
  memoryLimit: z.string().min(1, 'Required').pipe(z.coerce.number()),
  case: z.string(),
  // pdf: z.instanceof(File).optional(),
  // zip: z.instanceof(File).optional(),
})
export type ProblemFormSchema = z.infer<typeof ProblemFormSchema>

export const problemRouter = contract.router(
  {
    getProblemTable: {
      method: 'GET',
      path: '',
      responses: {
        200: z.array(ProblemTableRowSchema),
      },
      summary: 'Get a list of problems for main table',
    },
    getProblem: {
      method: 'GET',
      path: '/:problemId',
      responses: {
        200: ProblemModel,
        // 403: z.object({ message: z.string() }),
        // 404: z.object({ message: z.string() }),
      },
      summary: 'Get a problem',
    },
    searchProblem: {
      method: 'GET',
      path: '/admin/search',
      query: z.object({
        search: z.string().optional(),
        limit: z.coerce.number().optional(),
        skip: z.coerce.number().optional(),
      }),
      responses: {
        200: z.array(ProblemModel.pick({ id: true, name: true, sname: true })),
      },
      summary: 'Search problems',
    },
    getProblemsForAdmin: {
      method: 'GET',
      path: '/admin/list',
      responses: {
        200: z.object({
          total: z.number(),
          data: z.array(AdminProblemSchema),
        }),
      },
      query: ListPaginationQuerySchema,
      summary: 'Get paginated problems for admin',
    },
    getPassedUsers: {
      method: 'GET',
      path: '/:problemId/user',
      responses: {
        200: z.array(PassedUserSchema),
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
      body: contract.type<{
        name: string
        sname: string
        score: string
        timeLimit: string
        memoryLimit: string
        case: string
        pdf?: FileSchema
        zip?: FileSchema
      }>(),
      summary: 'Create a problem',
    },
    updateProblem: {
      method: 'PUT',
      path: '/:problemId',
      responses: {
        200: ProblemWithoutExampleSchema,
      },
      contentType: 'multipart/form-data',
      body: contract.type<{
        name: string
        sname: string
        score: string
        timeLimit: string
        memoryLimit: string
        case: string
        pdf?: FileSchema
        zip?: FileSchema
      }>(),
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

export const LoginBody = UserModel.pick({ username: true, password: true })
export type LoginBody = z.infer<typeof LoginBody>
export const LoginResponse = z.object({
  user: UserSchema,
  accessToken: z.string(),
})
export type LoginResponse = z.infer<typeof LoginResponse>

export const RegisterBody = UserModel.pick({
  username: true,
  showName: true,
  password: true,
})
export type RegisterBody = z.infer<typeof RegisterBody>

export const authRouter = contract.router(
  {
    register: {
      method: 'POST',
      path: '/register',
      responses: {
        201: z.object({ message: z.string() }),
      },
      body: RegisterBody,
      summary: 'Register a user',
    },
    login: {
      method: 'POST',
      path: '/login',
      responses: {
        200: LoginResponse,
      },
      body: LoginBody,
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
      200: z.coerce.date(),
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
  user: userRouter,
  chat: chatRouter,
  problem: problemRouter,
  contest: contestRouter,
  submission: submissionRouter,
  announcement: announcementRouter,
})
