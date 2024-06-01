import { storage } from '.'

export type AvatarSize = 'default' | 'small'
export interface AvatarKey {
  userId: number
  size?: AvatarSize
}
export async function getAvatarUrl({ userId, size = 'default' }: AvatarKey) {
  try {
    const url = await storage
      .ref('images')
      .child(`${userId}${size === 'small' ? '_32' : ''}.jpeg`)
      .getDownloadURL()
    return url as string
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return null
    }
    throw error
  }
}
