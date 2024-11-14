import { User, UserAuthorizationProvider } from '@prisma/client'

export type UserWithAuthProviders = User & {
  UserAuthorizationProvider: UserAuthorizationProvider[]
}
