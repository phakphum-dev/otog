import { Module } from '@nestjs/common'

import { BookshelfController } from './bookshelf.controller'
import { BookshelfService } from './bookshelf.service'

@Module({
  providers: [BookshelfService],
  controllers: [BookshelfController],
})
export class BookshelfModule {}
