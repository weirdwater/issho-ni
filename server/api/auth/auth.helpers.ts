import { Either, isLeft, isRight } from 'shared/fun'
import { User } from '../user/user.entity'
import { Client } from '../client/client.entity'
import { createParamDecorator } from '@nestjs/common';

export type Consumer = Either<User, Client>

export const isUser = isLeft

export const isClient = isRight

export const Consumer = createParamDecorator((data, req) => {
  return req.consumer as Consumer
})
