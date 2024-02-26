import { ApiProperty } from '@nestjs/swagger'
import { Role } from 'src/core/constants'

export class UserDTO {
  @ApiProperty()
  id: number

  username: string

  showName: string

  @ApiProperty({ enum: Role })
  role: Role

  rating: number

  constructor(user: any) {
    this.id = user?.id
    this.username = user?.username
    this.showName = user?.showName
    this.role = user?.role
    this.rating = user?.rating
  }
}
