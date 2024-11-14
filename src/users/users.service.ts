import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { BadRequestError, NotFoundError } from '../common/exceptions';
import { ErrorCodes } from '../common/enums/ErrorCodes';
import { AuthProvider } from '../auth/auth.provider';
import { UsersRepository } from './users.repository';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => AuthProvider))
    private authProvider: AuthProvider,
    private usersRepository: UsersRepository,
  ) {}

  public async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findUserById(id);
  }

  public async findRoles(id: string) {
    return await this.usersRepository.findRoles(id);
  }

  public validateUser() {
    this.twitchAuthentication();
  }

  private twitchAuthentication() {
    throw new BadRequestError('Twitch authentication is not implemented');
  }

  public async getUser(userId: string) {
    const user = await this.usersRepository.findUserById(userId);

    if (!user) throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND);

    return user;
  }

  public async updateName(userId: string, firstName: string, lastName: string) {
    return await this.usersRepository.updateName(userId, firstName, lastName);
  }
}
