import { Injectable } from '@nestjs/common';
import { ForbiddenError } from '../common/exceptions';
import { TDecipher } from './types/decipher.types';
import { JwtService } from '@nestjs/jwt';
import { AuthProviderRepository } from './auth.provider.repository';
@Injectable()
export class AuthProvider {
  private readonly twitchUrls = {
    urlIdToken: 'https://id.twitch.tv/oauth2/tokeninfo?id_token=',
    urlAccessToken: 'https://id.twitch.tv/oauth2/userinfo?alt=json&access_token=',
  };
  constructor(
    private readonly jwtService: JwtService,
    private readonly authProviderRepository: AuthProviderRepository,
  ) {}

  async decipher(decipher: TDecipher) {
    const provider = await this.authProviderRepository.findAuthorizationProvider(decipher.provider);

    if (!provider) throw new ForbiddenError('Invalid provider');

    return this.twitchDecipher();
  }

  twitchDecipher() {
    return null;
  }
}
