import { NestFactory, Reflector } from '@nestjs/core'
import { DocumentBuilder } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { generateOpenApi } from '@ts-rest/open-api'
import cookieParser from 'cookie-parser'

import { router } from '@otog/contract'

import { AppModule } from './app.module'
import { JwtAuthGuard } from './core/guards/jwt-auth.guard'
import { OfflineModeGuard } from './core/guards/offline-mode.guard'
import { environment } from './env'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(cookieParser())
  app.enableCors({
    credentials: true,
    origin: true,
  })
  const reflector = app.get(Reflector)
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    environment.OFFLINE_MODE
      ? new OfflineModeGuard(reflector)
      : (undefined as never)
  )

  if (environment.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('OTOG API')
      .setDescription('API service for OTOG')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const OpenApiSpecification = generateOpenApi(router, config)
    app.use(
      '/doc',
      apiReference({
        spec: {
          content: OpenApiSpecification,
        },
      })
    )
  }

  await app.listen(environment.PORT)
}

bootstrap()
