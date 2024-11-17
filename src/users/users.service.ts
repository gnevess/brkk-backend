import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { NotFoundError } from '../common/exceptions';
import { ErrorCodes } from '../common/enums/ErrorCodes';
import { AuthProvider } from '../auth/auth.provider';
import { UsersRepository } from './users.repository';
import { User } from '@prisma/client';
import { TwitchAuthDTO } from 'src/auth/dto/twitch-auth.dto';
import { EAuthenticationProviders } from 'src/common/enums/AuthenticationProviders';

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

  public async validateUser(data: TwitchAuthDTO) {
    return await this.twitchAuthentication(data);
  }

  private async twitchAuthentication(data: TwitchAuthDTO) {
    // TODO: Implement twitch authentication
    // Check if user exists by email
    const existingUser = await this.usersRepository.findUserByEmail(data.userData.email);

    if (existingUser) {
      // Update existing user with latest Twitch data
      const updatedUser = await this.usersRepository.updateUser(existingUser.id, {
        displayName: data.userData.display_name,
        avatar: data.userData.profile_image_url,
        login: data.userData.login,
      });

      return updatedUser;
    }

    // Create new user
    const newUser = await this.usersRepository.createUser(EAuthenticationProviders.TWITCH, data.userData.email, data.userData.display_name, data.userData.login, data.userData.profile_image_url);

    return newUser;
  }

  public async getUser(userId: string) {
    const user = await this.usersRepository.findUserById(userId);

    if (!user) throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND);

    return user;
  }
}
