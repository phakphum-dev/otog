import { Controller, UseGuards } from '@nestjs/common'
import {
  TsRestHandler,
  nestControllerContract,
  tsRestHandler,
} from '@ts-rest/nest'
import { AccessState, Role } from 'src/core/constants'
import { OfflineAccess } from 'src/core/decorators/offline-mode.decorator'
import { Roles } from 'src/core/decorators/roles.decorator'
import { User } from 'src/core/decorators/user.decorator'
import { RolesGuard } from 'src/core/guards/roles.guard'
import { z } from 'zod'

import { contestRouter } from '@otog/contract'

import { UserDTO } from '../user/dto/user.dto'
import { ContestService } from './contest.service'

const c = nestControllerContract(contestRouter)

@Controller()
@UseGuards(RolesGuard)
export class ContestController {
  constructor(private contestService: ContestService) {}

  @TsRestHandler(c.listContest, { jsonQuery: true })
  listContest() {
    return tsRestHandler(c.listContest, async ({ query }) => {
      const [contests, total] = await Promise.all([
        this.contestService.listContest(query),
        this.contestService.countContest(),
      ])
      return { status: 200, body: { data: contests, total } }
    })
  }

  @TsRestHandler(c.getCurrentContest)
  @OfflineAccess(AccessState.Authenticated)
  getCurrentContest() {
    return tsRestHandler(c.getCurrentContest, async () => {
      // TODO not private
      const currentContest = await this.contestService.currentContest()
      return { status: 200, body: { currentContest } }
    })
  }

  @TsRestHandler(c.getContest)
  @OfflineAccess(AccessState.Authenticated)
  getContest() {
    return tsRestHandler(c.getContest, async ({ params: { contestId } }) => {
      const id = z.coerce.number().parse(contestId)
      const contest = await this.contestService.findOneById(id)
      return { status: 200, body: contest }
    })
  }

  @TsRestHandler(c.getContestScoreboard)
  getContestScoreboard(@User() user?: UserDTO) {
    return tsRestHandler(
      c.getContestScoreboard,
      async ({ params: { contestId } }) => {
        const id = z.coerce.number().parse(contestId)
        const scoreboard = await this.contestService.scoreboardByContestId(id)
        if (!scoreboard) {
          return { status: 404, body: { message: 'Not Found' } }
        }
        // TODO validate user if contest is private
        if (
          user?.role === Role.Admin ||
          new Date() > new Date(scoreboard.contest.timeEnd)
        ) {
          return { status: 200, body: scoreboard }
        }
        return { status: 403, body: { message: 'Forbidden' } }
      }
    )
  }

  @TsRestHandler(c.getContestPrize)
  getContestPrize() {
    return tsRestHandler(
      c.getContestPrize,
      async ({ params: { contestId } }) => {
        const id = z.coerce.number().parse(contestId)
        // TODO validate user if contest is private
        const prize = await this.contestService.scoreboardPrizeByContestId(id)
        return { status: 200, body: prize }
      }
    )
  }

  //  TODO have i join the contest

  //Admin Only

  @TsRestHandler(c.createContest)
  @Roles(Role.Admin)
  createContest() {
    return tsRestHandler(c.createContest, async ({ body }) => {
      const contest = await this.contestService.create(body)
      return { status: 200, body: contest }
    })
  }

  @TsRestHandler(c.toggleProblemToContest)
  @Roles(Role.Admin)
  toggleProblemToContest() {
    return tsRestHandler(
      c.toggleProblemToContest,
      async ({ body: { problemId, show }, params: { contestId } }) => {
        const id = z.coerce.number().parse(contestId)
        const contest = await this.contestService.toggleProblemToContest(
          id,
          problemId,
          show
        )
        return { status: 200, body: contest }
      }
    )
  }

  @TsRestHandler(c.putProblemToContest)
  @Roles(Role.Admin)
  putProblemToContest() {
    return tsRestHandler(
      c.putProblemToContest,
      async ({ body, params: { contestId } }) => {
        const id = z.coerce.number().parse(contestId)
        await this.contestService.putProblemToContest({
          contestId: id,
          data: body,
        })
        return { status: 200, body: {} }
      }
    )
  }

  @TsRestHandler(c.updateContest)
  @Roles(Role.Admin)
  updateContest() {
    return tsRestHandler(
      c.updateContest,
      async ({ body, params: { contestId } }) => {
        const id = z.coerce.number().parse(contestId)
        const contest = await this.contestService.updateContest(id, body)
        return { status: 200, body: contest }
      }
    )
  }

  @TsRestHandler(c.deleteContest)
  @Roles(Role.Admin)
  deleteContest() {
    return tsRestHandler(c.deleteContest, async ({ params: { contestId } }) => {
      const id = z.coerce.number().parse(contestId)
      const contest = await this.contestService.deleteContest(id)
      return { status: 200, body: contest }
    })
  }

  @TsRestHandler(c.contestSignUp)
  @Roles(Role.Admin)
  contestSignUp() {
    return tsRestHandler(
      c.contestSignUp,
      async ({ params: { contestId }, body: { userId } }) => {
        const id = z.coerce.number().parse(contestId)
        const userContest = await this.contestService.addUserToContest(
          id,
          userId
        )
        return { status: 200, body: userContest }
      }
    )
  }

  //  TODO who have join the contest?

  @TsRestHandler(c.getContestsForAdmin, { jsonQuery: true })
  @Roles(Role.Admin)
  getContestsForAdmin() {
    return tsRestHandler(
      c.getContestsForAdmin,
      async ({ query: { limit = 10, skip = 0, search } }) => {
        const [contests, total] = await Promise.all([
          this.contestService.getContestsForAdmin({
            limit,
            skip,
            search,
          }),
          this.contestService.getContestCountForAdmin({
            search,
          }),
        ])
        return { status: 200, body: { data: contests, total } }
      }
    )
  }

  @TsRestHandler(c.getContestForAdmin, { jsonQuery: true })
  @Roles(Role.Admin)
  getContestForAdmin() {
    return tsRestHandler(c.getContestForAdmin, async ({ params }) => {
      const contestId = z.coerce.number().parse(params.contestId)
      const contest = await this.contestService.getContestForAdmin({
        id: contestId,
      })
      if (contest === null) {
        return { status: 404, body: { message: 'Not Found' } }
      }
      return { status: 200, body: contest }
    })
  }
}
