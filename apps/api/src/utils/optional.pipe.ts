import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class OptionalIntPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value === undefined) {
      return undefined;
    }
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) {
      throw new BadRequestException(
        'Validation failed (numeric string is expected)',
      );
    }
    return parsedValue;
  }
}
