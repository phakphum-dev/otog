export const SEQUELIZE = 'SEQUELIZE'
export const DEVELOPMENT = 'development'
export const PRODUCTION = 'production'
export const USER_REPOSITORY = 'USER_REPOSITORY'
export const USERCONTEST_REPOSITORY = 'USERCONTEST_REPOSITORY'
export const PROBLEM_REPOSITORY = 'PROBLEM_REPOSITORY'
export const REFRESHTOKEN_REPOSITORY = 'REFRESHTOKEN_REPOSITORY'
export const CONTEST_REPOSITORY = 'CONTEST_REPOSITORY'
export const CONTESTPROBLEM_REPOSITORY = 'CONTESTPROBLEM_REPOSITORY'
export const SUBMISSION_REPOSITORY = 'SUBMISSION_REPOSITORY'
export const CHAT_REPOSITORY = 'CHAT_REPOSITORY'
export const ANNOUNCEMENT_REPOSITORY = 'ANNOUNCEMENT_REPOSITORY'
export const ROLES_KEY = 'roles'
export const OFFLINE_KEY = 'offline_roles'
export const IS_PUBLIC_KEY = 'isPublic'

export const DOC_DIR = 'docs'
export const TESTCASE_DIR = 'source'
export const UPLOAD_DIR = 'volumes/upload'

export enum Role {
  User = 'user',
  Admin = 'admin',
}

export enum AccessState {
  Public = 'public',
  Authenticated = 'authenticated',
}

export enum Status {
  Waiting = 'waiting',
  Grading = 'grading',
  Accept = 'accept',
  Reject = 'reject',
}

export enum GradingMode {
  ACM = 'acm',
  Classic = 'classic',
}

export enum ContestMode {
  Rated = 'rated',
  Unrated = 'unrated',
}
