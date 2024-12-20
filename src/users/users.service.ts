import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../common/exceptions';
import { ErrorCodes } from '../common/enums/ErrorCodes';
import { UsersRepository } from './users.repository';
import { PointsHistoryStatus, User } from '@prisma/client';
import { TwitchAuthDTO } from 'src/auth/dto/twitch-auth.dto';
import { EAuthenticationProviders } from 'src/common/enums/AuthenticationProviders';
import { BadgeStatus } from './interfaces/badge-status.interface';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  public async addPoints(userId: string, points: number) {
    return await this.usersRepository.addPoints(userId, points);
  }

  public async findByLogin(login: string): Promise<User | null> {
    return await this.usersRepository.findUserByLogin(login);
  }

  public async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findUserById(id);
  }

  public async findRoles(id: string) {
    return await this.usersRepository.findRoles(id);
  }

  public async validateUser(data: TwitchAuthDTO) {
    return await this.twitchAuthentication(data);
  }

  public async updateBadges(userId: string, badgeStatus: BadgeStatus) {
    return this.usersRepository.updateBadges(userId, badgeStatus);
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
    const newUser = await this.usersRepository.createUser(
      EAuthenticationProviders.TWITCH,
      data.userData.email,
      data.userData.display_name,
      data.userData.login,
      data.userData.profile_image_url,
    );

    return newUser;
  }

  public async getUser(userId: string) {
    const user = await this.usersRepository.findUserById(userId);

    if (!user) throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND);

    return user;
  }

  public createPointsHistory(
    userId: string,
    points: number,
    status: PointsHistoryStatus,
    title: string,
    description: string,
  ) {
    return this.usersRepository.createPointsHistory(userId, points, status, title, description);
  }
}
