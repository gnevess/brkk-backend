import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../enums/ErrorCodes';


export default class ConflictError extends HttpException {
  constructor(
    public description = 'Conflict',
    public code = ErrorCodes.GENERIC,
  ) {
    super({ message: description, code, statusCode: HttpStatus.CONFLICT }, HttpStatus.CONFLICT);
  }
}
