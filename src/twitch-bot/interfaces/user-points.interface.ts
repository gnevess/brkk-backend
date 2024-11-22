export interface UserPointsData {
  username: string;
  displayName: string;
  points: number;
  reason: 'chat' | 'timer' | 'join';
}

export interface StreamStatus {
  isOnline: boolean;
  lastCheck: Date;
}
