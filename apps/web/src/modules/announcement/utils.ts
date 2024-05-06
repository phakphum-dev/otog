import { Descendant } from 'slate'

export function createEmptyAnnouncement(): Descendant[] {
  return [
    {
      type: 'heading-one',
      children: [{ text: '', bold: true }],
    },
  ]
}
