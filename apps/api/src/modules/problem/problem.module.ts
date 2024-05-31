import { Module } from '@nestjs/common'

// import { S3Module } from 'nestjs-s3'
import { AuthModule } from '../auth/auth.module'
import { ContestModule } from '../contest/contest.module'
import { SubmissionModule } from '../submission/submission.module'
import { UserModule } from '../user/user.module'
import { ProblemController } from './problem.controller'
import { ProblemService } from './problem.service'

@Module({
  imports: [ContestModule, AuthModule, UserModule, SubmissionModule],
  controllers: [ProblemController],
  providers: [ProblemService],
  exports: [ProblemService],
})
export class ProblemModule {}
