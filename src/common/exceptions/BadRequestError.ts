import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../enums/ErrorCodes';

export default class BadRequestError extends HttpException {
  constructor(
    public description = 'Bad Request',
    public code = ErrorCodes.GENERIC,
  ) {
    super({ message: description, code, statusCode: HttpStatus.BAD_REQUEST }, HttpStatus.BAD_REQUEST);
  }
}
