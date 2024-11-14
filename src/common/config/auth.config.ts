import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  JWT_SECRET: process.env.JWT_SECRET ?? '2f!Qu42t0%1G@V',
  JWT_EXPIRES_TIME: process.env.JWT_EXPIRES_TIME ?? '1d',
}));
