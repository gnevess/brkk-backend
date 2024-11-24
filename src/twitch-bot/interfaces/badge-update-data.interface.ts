export interface BadgeUpdateData {
  username: string;
  badges: {
    moderator?: string;
    subscriber?: string;
    'sub-gifter'?: string;
    premium?: string;
  };
  badgesInfo: {
    subscriber?: string;
  };
  vip: boolean;
  turbo: boolean;
  color: string;
}
