import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {User} from '@prisma/client'
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {

    @Get('currentuser')
    getCurrent(@GetUser() user:User) {

        return user
    }
}
