import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  AnnouncementCreateInputSchema,
  AnnouncementSchema,
  ChatSchema,
  ContestCreateInputSchema,
  ContestProblemSchema,
  ContestSchema,
  ContestUpdateInputSchema,
  ProblemCreateInputSchema,
  ProblemSchema,
  ProblemUpdateInputSchema,
  SubmissionSchema,
  SubmissionStatusSchema,
  UserContestSchema,
  UserSchema,
  UserUpdateInputSchema,
} from "@otog/database";

// TODO: https://github.com/colinhacks/zod/discussions/2171

export const contract: ReturnType<typeof initContract> = initContract();

export const announcementRouter = contract.router(
  {
    getAnnouncements: {
      method: "GET",
      path: "",
      responses: {
        200: z.array(AnnouncementSchema),
      },
      summary: "Get all announcements",
    },
    createAnnouncement: {
      method: "POST",
      path: "",
      body: AnnouncementSchema.pick({ value: true }),
      responses: {
        201: AnnouncementSchema,
        400: z.object({ message: z.string() }),
      },
      summary: "Create an announcement",
    },
    getContestAnnouncments: {
      method: "GET",
      path: "/contest/:contestId",
      responses: {
        200: z.array(AnnouncementSchema),
      },
      summary: "Get contest announcements",
    },
    createContestAnnouncement: {
      method: "POST",
      path: "/contest/:contestId",
      body: AnnouncementSchema.pick({ value: true }),
      responses: {
        201: AnnouncementSchema,
        400: z.object({ message: z.string() }),
      },
      summary: "Create an announcement in a contest",
    },
    deleteAnnouncement: {
      method: "DELETE",
      path: "/:announcementId",
      body: null,
      responses: {
        200: AnnouncementSchema,
      },
      summary: "Delete an announcement",
    },
    showAnnouncement: {
      method: "PATCH",
      path: "/:announcementId",
      body: AnnouncementSchema.pick({ show: true }),
      responses: {
        200: AnnouncementSchema,
      },
      summary: "Toggle show of an announcement",
    },
    updateAnnouncement: {
      method: "PUT",
      path: "/:announcementId",
      body: AnnouncementCreateInputSchema,
      responses: {
        200: AnnouncementSchema,
      },
      summary: "Update an announcement",
    },
  },
  { pathPrefix: "/announcement" }
);

const PaginationQuerySchema = z.object({
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const chatRouter = contract.router({
  getChats: {
    method: "GET",
    path: "/chat",
    responses: {
      200: z.array(ChatSchema),
    },
    query: PaginationQuerySchema,
    summary: "Get paginated chats",
  },
});

const UserWithourPasswordSchema = UserSchema.pick({
  id: true,
  username: true,
  showName: true,
  role: true,
  rating: true,
});

const SubmissionWithoutSourceCodeSchema = SubmissionSchema.pick({
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
    problem: ProblemSchema.pick({
      id: true,
      name: true,
    }).nullable(),
  })
  .extend({
    user: UserWithourPasswordSchema.nullable(),
  });

const SubmissionWithSourceCodeSchema = SubmissionWithoutSourceCodeSchema.merge(
  SubmissionSchema.pick({ sourceCode: true })
);

export const submissionRouter = contract.router(
  {
    getSubmissions: {
      method: "GET",
      path: "",
      responses: {
        200: z.array(SubmissionWithoutSourceCodeSchema),
      },
      query: PaginationQuerySchema,
      summary: "Get paginated submissions",
    },
    getContestSubmissions: {
      method: "GET",
      path: "/contest",
      responses: {
        200: z.array(SubmissionWithoutSourceCodeSchema),
      },
      query: PaginationQuerySchema,
      summary: "Get paginated contest submissions",
    },
    getLatestSubmissionByProblemId: {
      method: "GET",
      path: "/problem/:problemId/latest",
      responses: {
        200: z.object({
          latestSubmission: SubmissionWithSourceCodeSchema.nullable(),
        }),
      },
      summary: "Get latest submission for a problem",
    },
    uploadFile: {
      method: "POST",
      path: "/problem/:problemId",
      contentType: "multipart/form-data",
      responses: {
        200: SubmissionSchema,
      },
      body: SubmissionSchema.pick({
        language: true,
        contestId: true,
      }),
      summary: "Submit code file",
    },
    getLatestSubmissionByUserId: {
      method: "GET",
      path: "/latest",
      responses: {
        200: z.object({
          latestSubmission: SubmissionWithSourceCodeSchema.nullable(),
        }),
      },
      summary: "Get latest submission for a user",
    },
    getSubmissionsByUserId: {
      method: "GET",
      path: "/user/:userId",
      responses: {
        200: z.array(SubmissionWithoutSourceCodeSchema),
        400: z.object({ message: z.string() }),
      },
      query: PaginationQuerySchema,
      summary: "Get submissions for a user",
    },
    getSubmission: {
      method: "GET",
      path: "/:submissionId",
      responses: {
        200: SubmissionWithoutSourceCodeSchema,
        404: z.object({ message: z.string() }),
      },
      summary: "Get a submission without source code",
    },
    getSubmissionWithSourceCode: {
      method: "GET",
      path: "/:submissionId/code",
      responses: {
        200: SubmissionWithSourceCodeSchema,
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      summary: "Get a submission with source code",
    },
    shareSubmission: {
      method: "PATCH",
      path: "/:submissionId/share",
      responses: {
        200: SubmissionSchema.pick({ public: true }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      body: z.object({ show: z.boolean() }),
      summary: "Toggle publicity of a submission",
    },
    rejudgeSubmission: {
      method: "PATCH",
      path: "/:submissionId/rejudge",
      responses: {
        200: SubmissionWithoutSourceCodeSchema,
        404: z.object({ message: z.string() }),
      },
      body: null,
      summary: "Rejudge a submission",
    },
    rejudgeProblem: {
      method: "PATCH",
      path: "/problem/:problemId/rejudge",
      responses: {
        200: z.undefined(),
        404: z.object({ message: z.string() }),
      },
      body: null,
      summary: "Rejudge all submissions of a problem",
    },
  },
  { pathPrefix: "/submission" }
);

export const userRouter = contract.router(
  {
    getUsers: {
      method: "GET",
      path: "",
      responses: {
        200: z.array(UserWithourPasswordSchema),
      },
      summary: "Get all users",
    },
    getOnlineUsers: {
      method: "GET",
      path: "",
      responses: {
        200: z.array(UserWithourPasswordSchema),
      },
      summary: "Get online users",
    },
    getUserProfile: {
      method: "GET",
      path: "/:userId/profile",
      responses: {
        200: UserWithourPasswordSchema.extend({
          userContest: z.array(
            UserContestSchema.pick({
              ratingAfterUpdate: true,
              rank: true,
            }).extend({
              contest: ContestSchema.pick({
                id: true,
                name: true,
                timeStart: true,
              }),
            })
          ),
        }).nullable(),
        404: z.object({ message: z.string() }),
      },
      summary: "Get a user by id",
    },
    updateUser: {
      method: "PUT",
      path: "/:userId",
      responses: {
        200: UserWithourPasswordSchema,
      },
      body: UserUpdateInputSchema,
      summary: "Update user data",
    },
    updateShowName: {
      method: "PATCH",
      path: "/:userId/name",
      responses: {
        200: UserSchema.pick({ showName: true }),
        403: z.object({ message: z.string() }),
      },
      body: UserSchema.pick({ showName: true }),
      summary: "Update user show name",
    },
  },
  { pathPrefix: "/user" }
);

const PrizeSchema = z.object({
  id: z.number(),
  problem: ProblemSchema.pick({ id: true }).nullable(),
  user: UserSchema.pick({ id: true, showName: true }).nullable(),
});

export const contestRouter = contract.router(
  {
    getContests: {
      method: "GET",
      path: "",
      responses: {
        200: z.array(ContestSchema),
      },
      summary: "Get all contests",
    },
    getCurrentContest: {
      method: "GET",
      path: "/now",
      responses: {
        200: z.object({
          currentContest: ContestSchema.nullable(),
        }),
      },
      summary: "Get the current contest",
    },
    getContest: {
      method: "GET",
      path: "/:contestId",
      responses: {
        200: ContestSchema.nullable(),
      },
      summary: "Get a contest",
    },
    getContestScoreboard: {
      method: "GET",
      path: "/:contestId/scoreboard",
      responses: {
        200: z.object({
          contest: ContestSchema.extend({
            userContest: z.array(UserContestSchema),
            contestProblem: z.array(
              ContestProblemSchema.extend({ problem: ProblemSchema })
            ),
          }),
          userContest: z.array(
            UserContestSchema.extend({
              submissions: z
                .array(
                  SubmissionSchema.pick({
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
      summary: "Get a contest",
    },
    getContestPrize: {
      method: "GET",
      path: "/:contestId/prize",
      responses: {
        200: z.object({
          firstBlood: z.array(PrizeSchema),
          fasterThanLight: z.array(PrizeSchema),
          passedInOne: z.array(PrizeSchema),
          oneManSolve: z.array(PrizeSchema),
        }),
      },
      summary: "Get a contest prize",
    },
    createContest: {
      method: "POST",
      path: "",
      responses: {
        200: ContestSchema,
      },
      body: ContestCreateInputSchema,
      summary: "Create a contest",
    },
    toggleProblemToContest: {
      method: "PATCH",
      path: "/:contestId",
      responses: { 200: z.object({ show: z.boolean() }) },
      body: z.object({ show: z.boolean(), problemId: z.coerce.number() }),
      summary: "Toggle problem to a contest",
    },
    updateContest: {
      method: "PUT",
      path: "/:contestId",
      responses: {
        200: ContestSchema,
      },
      body: ContestUpdateInputSchema,
      summary: "Update a contest",
    },
    deleteContest: {
      method: "DELETE",
      path: "/:contestId",
      body: null,
      responses: {
        200: ContestSchema,
      },
      summary: "Delete a contest",
    },
    contestSignUp: {
      method: "POST",
      path: "/:contestId/signup",
      body: z.object({ userId: z.coerce.number() }),
      responses: {
        200: UserContestSchema,
      },
      summary: "Sign up for a contest",
    },
  },
  { pathPrefix: "/contest" }
);

const ProblemWithoutExampleSchema = ProblemSchema.omit({ examples: true });
const LatestSubmissionSchema = z.object({
  latestSubmissionId: z.number().nullable(),
  status: SubmissionStatusSchema.nullable(),
});
const PassedCountSchema = z.object({
  passedCount: z.number(),
});
const ProblemWithDetailSchema = ProblemWithoutExampleSchema.merge(
  LatestSubmissionSchema
).merge(PassedCountSchema);
const PassedUserSchema = UserSchema.pick({
  id: true,
  role: true,
  username: true,
  showName: true,
  rating: true,
});

export const problemRouter = contract.router(
  {
    getProblems: {
      method: "GET",
      path: "",
      responses: {
        200: z.array(
          z.union([
            ProblemWithDetailSchema,
            ProblemWithoutExampleSchema.merge(PassedCountSchema),
          ])
        ),
      },
      summary: "Get problems",
    },
    getProblem: {
      method: "GET",
      path: "/:problemId",
      responses: {
        200: ProblemWithoutExampleSchema,
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      summary: "Get a problem",
    },
    getPassedUsers: {
      method: "GET",
      path: "/:problemId/user",
      responses: {
        200: z.array(PassedUserSchema),
      },
      summary: "Get passed users",
    },
    getPdf: {
      method: "GET",
      path: "/doc/:problemId",
      responses: { 200: z.string() },
      summary: "Get a pdf document for a problem",
    },
    toggleShowProblem: {
      method: "PATCH",
      path: "/:problemId",
      responses: {
        200: ProblemWithoutExampleSchema,
      },
      body: ProblemSchema.pick({ show: true }),
      summary: "Toggle problem show state",
    },
    createProblem: {
      method: "POST",
      path: "",
      contentType: "multipart/form-data",
      responses: {
        201: ProblemWithoutExampleSchema,
      },
      body: ProblemCreateInputSchema,
      summary: "Create a problem",
    },
    updateProblem: {
      method: "PUT",
      path: "/:problemId",
      responses: {
        200: ProblemWithoutExampleSchema,
      },
      body: ProblemUpdateInputSchema,
      summary: "Update a problem",
    },
    deleteProblem: {
      method: "DELETE",
      path: "/:problemId",
      responses: {
        200: ProblemWithoutExampleSchema,
      },
      body: null,
      summary: "Delete a problem",
    },
    updateProblemExamples: {
      method: "PUT",
      path: "/:problemId/examples",
      responses: {
        200: ProblemSchema.pick({ examples: true }),
      },
      body: z.any(),
      summary: "Update problem example testcases",
    },
  },
  { pathPrefix: "/problem" }
);

export const authRouter = contract.router(
  {
    register: {
      method: "POST",
      path: "/register",
      responses: {
        201: z.object({ message: z.string() }),
      },
      body: UserSchema.pick({ username: true, showName: true, password: true }),
      summary: "Register a user",
    },
    login: {
      method: "POST",
      path: "/login",
      responses: {
        200: z.object({ message: z.string() }),
      },
      body: UserSchema.pick({ username: true, password: true }),
      summary: "Login and get tokens",
    },
    refreshToken: {
      method: "GET",
      path: "/refresh/token",
      responses: {
        200: z.object({ message: z.string() }),
      },
      summary: "Refresh access token",
    },
  },
  { pathPrefix: "/auth" }
);

export const appRouter = contract.router({
  time: {
    method: "GET",
    path: "/time",
    responses: {
      200: z.date(),
    },
    summary: "Get server time",
  },
  ping: {
    method: "GET",
    path: "/ping",
    responses: {
      200: z.string(),
    },
    summary: "Ping server",
  },
});

export const router = contract.router({
  app: appRouter,
  auth: authRouter,
  problem: problemRouter,
  user: userRouter,
  submission: submissionRouter,
  chat: chatRouter,
  announcement: announcementRouter,
});
