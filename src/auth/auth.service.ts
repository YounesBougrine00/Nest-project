import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AuthDto } from './dto';
import * as argon from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signin(dto: AuthDto) {
    //find user by email
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });
    //if user not exist
    if (!user) {
      throw new ForbiddenException('Incorrect credentials');
    }

    //compare password
    const pwd_matches = await argon.verify(user.hash, dto.password);

    //if password incorrect
    if (!pwd_matches) {
      throw new ForbiddenException('Incorrect credentials');
    }

    //Send back user
    return this.assignToken(user.id,user.email);
  }

  async signup(dto: AuthDto) {
    //generate password hash
    const hash = await argon.hash(dto.password);

    //save new user in DB
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });

    //Send back user
    return this.assignToken(user.id,user.email);

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('credentials taken');
        }
      }
      throw error;
    }
  }

  async assignToken(userId: number, email: string): Promise<{access_token:string}> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET')

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    return {
      access_token: token
    }
    
  }
}
