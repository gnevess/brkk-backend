import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../enums/ErrorCodes';

export default class UnauthorizedError extends HttpException {
  constructor(
    public description = 'Unauthorized',
    public code = ErrorCodes.GENERIC,
  ) {
    super({ message: description, code, statusCode: HttpStatus.UNAUTHORIZED }, HttpStatus.UNAUTHORIZED);
  }
}
