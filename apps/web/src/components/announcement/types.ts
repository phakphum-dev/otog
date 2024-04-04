import { Descendant } from 'slate'

export interface Announcement {
  id: number
  value: Descendant[]
  show: boolean
  contestId: number | null
}
