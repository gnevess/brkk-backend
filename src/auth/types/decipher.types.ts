import { EAuthenticationProviders } from 'src/common/enums/AuthenticationProviders';

interface ITwitchDecipher {
  provider: EAuthenticationProviders.TWITCH;
}

export type TDecipher = ITwitchDecipher;
