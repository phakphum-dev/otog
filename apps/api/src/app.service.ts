import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getPong() {
    return 'Pong';
  }
}
