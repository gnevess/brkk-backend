import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from 'src/common/config/auth.config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/common/strategy/jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthProvider } from './auth.provider';
import { AuthProviderRepository } from './auth.provider.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('auth.JWT_EXPIRES_TIME'),
        },
      }),
    }),
    forwardRef(() => UsersModule),
  ],
  providers: [AuthService, JwtStrategy, AuthProvider, AuthProviderRepository],
  controllers: [AuthController],
  exports: [AuthService, AuthProvider],
})
export class AuthModule {}
