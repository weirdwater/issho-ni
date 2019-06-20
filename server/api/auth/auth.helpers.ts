import { Either, isLeft, isRight } from 'shared/fun'
import { User } from '../user/user.entity'
import { Client } from '../client/client.entity'

export type Consumer = Either<User, Client>

export const isUser = isLeft

export const isClient = isRight
