import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { OfflineModeGuard } from './core/guards/offline-mode.guard';
import { generateOpenApi } from '@ts-rest/open-api';
import { router } from '@otog/contract';
import { environment } from './env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    credentials: true,
    origin: true,
  });
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    environment.OFFLINE_MODE
      ? new OfflineModeGuard(reflector)
      : (undefined as never),
  );

  if (!environment.OFFLINE_MODE) {
    const config = new DocumentBuilder()
      .setTitle('OTOG API')
      .setDescription('API service for OTOG')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = generateOpenApi(router, config);
    SwaggerModule.setup('doc', app, document);
  }

  await app.listen(environment.PORT);
}

bootstrap();
