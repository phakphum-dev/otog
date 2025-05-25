import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import {
  TsRestHandler,
  nestControllerContract,
  tsRestHandler,
} from '@ts-rest/nest'
import type { Request, Response } from 'express'
import * as path from 'path'
import { AccessState, Role } from 'src/core/constants'
import { OfflineAccess } from 'src/core/decorators/offline-mode.decorator'
import { Roles } from 'src/core/decorators/roles.decorator'
import { User } from 'src/core/decorators/user.decorator'
import { RolesGuard } from 'src/core/guards/roles.guard'
import { UPLOAD_DIR } from 'src/utils/file.util'
import { z } from 'zod'

import { ProblemFormSchema, problemRouter } from '@otog/contract'

import { AuthService } from '../auth/auth.service'
import { ContestService } from '../contest/contest.service'
import { UserDTO } from '../user/dto/user.dto'
import { UserService } from '../user/user.service'
import { UploadedFilesObject } from './dto/problem.dto'
import { ProblemService } from './problem.service'

const c = nestControllerContract(problemRouter)

@Controller()
@UseGuards(RolesGuard)
export class ProblemController {
  constructor(
    private problemService: ProblemService,
    private contestService: ContestService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  @TsRestHandler(c.getProblemTable)
  getProblemTable(@User() user: UserDTO | undefined) {
    return tsRestHandler(c.getProblemTable, async () => {
      if (!user) {
        const problems = await this.problemService.findMany({
          show: true,
        })
        return { status: 200, body: problems }
      }
      if (user.role === Role.Admin) {
        const problems = await this.problemService.findMany({
          userId: user.id,
        })
        return { status: 200, body: problems }
      }
      const problems = await this.problemService.findMany({
        show: true,
        userId: user.id,
      })
      return { status: 200, body: problems }
    })
  }

  @TsRestHandler(c.getProblem)
  getProblem(@User() user: UserDTO) {
    return tsRestHandler(c.getProblem, async ({ params: { problemId } }) => {
      const id = z.coerce.number().parse(problemId)
      const problem = await this.problemService.findOneByIdWithExamples(id)
      if (!problem) {
        return { status: 404, body: { message: 'Not Found' } }
      }
      if (problem.show === false && user.role !== Role.Admin) {
        return { status: 403, body: { message: 'Forbidden' } }
      }
      return { status: 200, body: problem }
    })
  }

  @TsRestHandler(c.getPassedUsers)
  getPassedUsers() {
    return tsRestHandler(c.getPassedUsers, async ({ params }) => {
      const problemId = z.coerce.number().parse(params.problemId)
      const users = await this.problemService.findPassedUser({ problemId })
      return { status: 200, body: users }
    })
  }

  @OfflineAccess(AccessState.Public)
  @Get('/problem/doc/:problemId')
  async getPdf(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const problem = await this.problemService.findOneById(problemId)
    if (!problem) {
      console.error('Cannot find problem with id', `${problemId}`)
      throw new NotFoundException()
    }
    if (problem.show === false) {
      const rid = req.cookies['RID']
      if (!rid) {
        console.error('rid not found', `${rid}`)
        throw new ForbiddenException()
      }
      const refreshToken = await this.authService.findOneByRID(rid)
      if (!refreshToken?.userId) {
        console.error('Cannot find user with RID', `${rid}`)
        throw new NotFoundException()
      }
      const user = await this.userService.findOneById(refreshToken.userId)

      // TODO validate user if contest is private
      const contests =
        await this.contestService.getStartedAndUnFinishedContests()
      if (
        user?.role !== Role.Admin &&
        !contests.some((c) =>
          c.contestProblem.some((p) => p.problemId === problem.id)
        )
      ) {
        console.error(
          'There is no contest right now and you are not admin',
          `${user?.id}`
        )
        throw new ForbiddenException()
      }
    }

    const readStream = await this.problemService.getProblemDocStream(problem.id)

    return readStream.pipe(res.type('application/pdf'))
  }

  //Admin route
  @TsRestHandler(c.toggleShowProblem)
  @Roles(Role.Admin)
  toggleShowProblem() {
    return tsRestHandler(
      c.toggleShowProblem,
      async ({ params: { problemId }, body: { show } }) => {
        const id = z.coerce.number().parse(problemId)
        const problem = await this.problemService.changeProblemShowById(
          id,
          show
        )
        return { status: 200, body: problem }
      }
    )
  }

  @TsRestHandler(c.createProblem)
  @Roles(Role.Admin)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pdf', maxCount: 1 },
        { name: 'zip', maxCount: 1 },
      ],
      {
        dest: path.join(process.cwd(), UPLOAD_DIR),
      }
    )
  )
  createProblem(@UploadedFiles() files: UploadedFilesObject) {
    return tsRestHandler(c.createProblem, async ({ body: bodyRaw }) => {
      const result = ProblemFormSchema.safeParse(bodyRaw)
      if (!result.success) {
        return { status: 400, body: { message: 'Bad Request' } }
      }
      const problem = await this.problemService.create(result.data, files)
      return { status: 201, body: problem }
    })
  }

  @TsRestHandler(c.updateProblem)
  @Roles(Role.Admin)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pdf', maxCount: 1 },
        { name: 'zip', maxCount: 1 },
      ],
      {
        dest: path.join(process.cwd(), UPLOAD_DIR),
      }
    )
  )
  updateProblem(@UploadedFiles() files: UploadedFilesObject) {
    return tsRestHandler(
      c.updateProblem,
      async ({ body: bodyRaw, params: { problemId } }) => {
        const id = z.coerce.number().parse(problemId)
        const result = ProblemFormSchema.safeParse(bodyRaw)
        if (!result.success) {
          return { status: 400, body: { message: 'Bad Request' } }
        }
        const problem = await this.problemService.replaceByProblemId(
          id,
          result.data,
          files
        )
        return { status: 200, body: problem }
      }
    )
  }

  @TsRestHandler(c.deleteProblem)
  @Roles(Role.Admin)
  deleteProblem() {
    return tsRestHandler(c.deleteProblem, async ({ params: { problemId } }) => {
      const id = z.coerce.number().parse(problemId)
      const problem = await this.problemService.delete(id)
      return { status: 200, body: problem }
    })
  }

  @TsRestHandler(c.updateProblemExamples)
  @Roles(Role.Admin)
  updateProblemExamples() {
    return tsRestHandler(
      c.updateProblemExamples,
      async ({ params: { problemId }, body }) => {
        const id = z.coerce.number().parse(problemId)
        const problem = await this.problemService.updateProblemExamples(
          id,
          body
        )
        return { status: 200, body: problem }
      }
    )
  }

  @TsRestHandler(c.getProblemsForAdmin, { jsonQuery: true })
  @Roles(Role.Admin)
  getProblemsForAdmin(@User() user?: UserDTO) {
    return tsRestHandler(
      c.getProblemsForAdmin,
      async ({ query: { skip = 0, limit = 10, search } }) => {
        if (user?.role !== Role.Admin) {
          return { status: 403, body: { message: 'Forbidden' } }
        }
        const [problems, total] = await Promise.all([
          this.problemService.getProblemsForAdmin({
            limit,
            skip,
            search,
          }),
          this.problemService.getProblemsCountForAdmin({ search }),
        ])
        return { status: 200, body: { data: problems, total } }
      }
    )
  }

  @TsRestHandler(c.searchProblem, { jsonQuery: true })
  @Roles(Role.Admin)
  searchProblem() {
    return tsRestHandler(
      c.searchProblem,
      async ({ query: { skip = 0, limit = 10, search } }) => {
        const problems = await this.problemService.searchProblem({
          limit,
          skip,
          search,
        })
        return { status: 200, body: problems }
      }
    )
  }

  @TsRestHandler(c.uploadAttachment)
  @Roles(Role.Admin)
  uploadAttachment() {
    return tsRestHandler(c.uploadAttachment, async ({ params, body }) => {
      const problemId = z.coerce.number().parse(params.problemId)
      const result = await this.problemService.uploadAttachment({
        body,
        problemId,
      })
      return { status: 200, body: result }
    })
  }

  @TsRestHandler(c.downloadAttachment)
  downloadAttachment(@User() user?: UserDTO) {
    return tsRestHandler(c.downloadAttachment, async ({ params }) => {
      const problemId = z.coerce.number().parse(params.problemId)

      const problem = await this.problemService.findOneById(problemId)
      if (!problem) {
        console.error('Cannot find problem with id', `${problemId}`)
        throw new NotFoundException()
      }
      if (problem.show === false) {
        // TODO validate user if contest is private
        const contests =
          await this.contestService.getStartedAndUnFinishedContests()
        if (
          user?.role !== Role.Admin &&
          !contests.some((c) =>
            c.contestProblem.some((p) => p.problemId === problem.id)
          )
        ) {
          throw new ForbiddenException(
            'There is no contest right now and you are not admin'
          )
        }
      }

      const result = await this.problemService.downloadAttachment(problemId)
      return { status: 200, body: result }
    })
  }
}
