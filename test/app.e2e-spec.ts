import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';

describe('App end to end', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3334);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3334');
  });

  afterAll(() => {
    app.close();
  });

  // Auth controller
  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@gmail.com',
      password: '1234',
    };

    describe('Signup', () => {
      it('should throw excep if email empty', ()=> {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password:'1234'
          })
          .expectStatus(400);
      })
      it('should throw excep if is not email', ()=> {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email:'false email',
            password:'13123'
          })
          .expectStatus(400);
      })
      it('should sing up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Signin', () => {
      it('should sing in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200).stores('user_token', 'access_token');
      });
    });
  });

  //User controller
  describe('User', () => {
    describe('Get current user', () => {
      it('should get current user', ()=>{
        return pactum
          .spec()
          .get('/users/currentuser')
          .withHeaders({
            Authorization:`Bearer $S{user_token}`
          })
          .expectStatus(200);
      })
    });
    describe('Edit user', () => {});
  });

  //Bookmark Controller
  describe('Bookmark', () => {
    describe('Create bookmark', () => {});
    describe('Delete bookmark', () => {});
    describe('Edit bookmark', () => {});
    describe('Get bookmark', () => {});
  });

  it.todo('should pass');
});
