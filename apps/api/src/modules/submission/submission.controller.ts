import {
  Controller,
  Param,
  ParseIntPipe,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
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

import { submissionRouter } from '@otog/contract'

import { ContestService } from '../contest/contest.service'
import { UserDTO } from '../user/dto/user.dto'
import { SubmissionService } from './submission.service'

const c = nestControllerContract(submissionRouter)

@Controller()
@UseGuards(RolesGuard)
export class SubmissionController {
  constructor(
    private submissionService: SubmissionService,
    private contestService: ContestService
  ) {}

  @TsRestHandler(c.getSubmissions)
  getSubmissions(@User() user: UserDTO) {
    return tsRestHandler(
      c.getSubmissions,
      async ({ query: { limit, offset } }) => {
        const submissions =
          user.role === Role.Admin
            ? await this.submissionService.findAll(offset, limit)
            : await this.submissionService.findAllWithOutContestAndAdmin(
                offset,
                limit
              )
        return { status: 200, body: submissions }
      }
    )
  }

  // unused
  @TsRestHandler(c.getContestSubmissions)
  @Roles(Role.Admin)
  getContestSubmissions() {
    return tsRestHandler(
      c.getContestSubmissions,
      async ({ query: { limit, offset } }) => {
        const submissions = await this.submissionService.findAllWithContest(
          offset,
          limit
        )
        return { status: 200, body: submissions }
      }
    )
  }

  @TsRestHandler(c.getLatestSubmissionByProblemId)
  @OfflineAccess(AccessState.Authenticated)
  @Roles(Role.Admin, Role.User)
  getLatestSubmissionByProblemId(@User() user: UserDTO) {
    return tsRestHandler(
      c.getLatestSubmissionByProblemId,
      async ({ params: { problemId } }) => {
        const id = z.coerce.number().parse(problemId)
        const latestSubmission =
          await this.submissionService.findFirstByProblemIdAndUserId(
            id,
            user.id
          )
        return { status: 200, body: { latestSubmission } }
      }
    )
  }

  @TsRestHandler(c.uploadFile)
  @OfflineAccess(AccessState.Authenticated)
  @Roles(Role.User, Role.Admin)
  @UseInterceptors(FileInterceptor('sourceCode'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @User() user: UserDTO,
    @Req() req: Request
  ) {
    console.log(req.formData, req.blob)
    return tsRestHandler(c.uploadFile, async ({ body, params, query }) => {
      console.log(body, file, query, params)
      const contestId = query.contestId
        ? z.coerce.number().parse(query.contestId)
        : null
      if (contestId) {
        // TODO validate user if contest is private
        await this.contestService.addUserToContest(contestId, user.id)
      }
      const problemId = z.coerce.number().parse(params.problemId)
      const submission = await this.submissionService.create({
        userId: user.id,
        problemId,
        file,
        language: body.language,
        contestId,
      })
      return { status: 200, body: submission }
    })
  }

  @TsRestHandler(c.getLatestSubmissionByUserId)
  @Roles(Role.User, Role.Admin)
  getLatestSubmissionByUserId(@User() user: UserDTO) {
    return tsRestHandler(c.getLatestSubmissionByUserId, async () => {
      const latestSubmission = await this.submissionService.findFirstByUserId(
        user.id
      )
      return { status: 200, body: { latestSubmission } }
    })
  }

  @TsRestHandler(c.getSubmissionsByUserId)
  @Roles(Role.User, Role.Admin)
  getSubmissionsByUserId(@User() user: UserDTO) {
    return tsRestHandler(
      c.getSubmissionsByUserId,
      async ({ params: { userId }, query: { limit, offset } }) => {
        const id = z.coerce.number().parse(userId)
        if (user.role === 'admin') {
          const submissions = await this.submissionService.findAllByUserId(
            id,
            offset,
            limit
          )
          return { status: 200, body: submissions }
        }
        if (user.id === id) {
          const submissions =
            await this.submissionService.findAllByUserIdWithOutContest(
              id,
              offset,
              limit
            )
          return { status: 200, body: submissions }
        }
        return { status: 400, body: { message: 'Bad request' } }
      }
    )
  }

  @TsRestHandler(c.getSubmission)
  @OfflineAccess(AccessState.Authenticated)
  getSubmissionById() {
    return tsRestHandler(
      c.getSubmission,
      async ({ params: { submissionId } }) => {
        const id = z.coerce.number().parse(submissionId)
        const submission = await this.submissionService.findOneByResultId(id)
        if (!submission) {
          return { status: 404, body: { message: 'Not Found' } }
        }
        return { status: 200, body: submission }
      }
    )
  }

  @TsRestHandler(c.getSubmissionWithSourceCode)
  @OfflineAccess(AccessState.Authenticated)
  getSubmissionWithSourceCode(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @User() user: UserDTO
  ) {
    return tsRestHandler(c.getSubmissionWithSourceCode, async () => {
      const submission =
        await this.submissionService.findOneByResultIdWithCode(submissionId)
      if (!submission) {
        return { status: 404, body: { message: 'Not Found' } }
      }
      if (
        !(
          submission.public ||
          submission.user.id === user.id ||
          user.role === Role.Admin
        )
      ) {
        return { status: 403, body: { message: 'Forbidden' } }
      }
      return { status: 200, body: submission }
    })
  }

  @TsRestHandler(c.shareSubmission)
  @Roles(Role.User, Role.Admin)
  shareSubmission(@User() user: UserDTO) {
    return tsRestHandler(
      c.shareSubmission,
      async ({ body: { show }, params: { submissionId } }) => {
        const id = z.coerce.number().parse(submissionId)
        const submission =
          await this.submissionService.findOneByResultIdWithCode(id)
        if (!submission) {
          return { status: 404, body: { message: 'Not Found' } }
        }
        if (!(user.id === submission.user.id || user.role === Role.Admin)) {
          return { status: 403, body: { message: 'Forbidden' } }
        }
        return {
          status: 200,
          body: await this.submissionService.updateSubmissionPublic(id, show),
        }
      }
    )
  }

  @TsRestHandler(c.rejudgeSubmission)
  @Roles(Role.Admin)
  rejudgeSubmission() {
    return tsRestHandler(
      c.rejudgeSubmission,
      async ({ params: { submissionId } }) => {
        const id = z.coerce.number().parse(submissionId)
        const submission = await this.submissionService.findOneByResultId(id)
        if (!submission) {
          return { status: 404, body: { message: 'Not Found' } }
        }
        return {
          status: 200,
          body: await this.submissionService.setSubmissionStatusToWaiting(id),
        }
      }
    )
  }

  @TsRestHandler(c.rejudgeProblem)
  @Roles(Role.Admin)
  rejudgeProblem() {
    return tsRestHandler(
      c.rejudgeProblem,
      async ({ params: { problemId } }) => {
        const id = z.coerce.number().parse(problemId)
        await this.submissionService.setAllLatestSubmissionStatusToWaiting(id)
        return { status: 200, body: undefined }
      }
    )
  }
}
