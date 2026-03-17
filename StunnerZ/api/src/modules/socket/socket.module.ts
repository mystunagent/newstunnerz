import { Module, forwardRef } from '@nestjs/common';
import { RedisModule } from 'nestjs-redis';
import { ConfigService } from 'nestjs-config';
import { QueueModule, AgendaModule } from 'src/kernel';
import { SocketUserService } from './services/socket-user.service';
import { WsUserConnectedGateway } from './gateways/user-connected.gateway';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';

@Module({
  imports: [
    QueueModule,
    AgendaModule.register(),
    // https://github.com/kyknow/nestjs-redis
    RedisModule.forRootAsync({
      // TODO - load config for redis socket
      useFactory: (configService: ConfigService) => configService.get('redis'),
      // useFactory: async (configService: ConfigService) => configService.get('redis'),
      inject: [ConfigService]
    }),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => PerformerModule)
  ],
  providers: [
    SocketUserService,
    WsUserConnectedGateway
  ],
  controllers: [
  ],
  exports: [
    SocketUserService
  ]
})
export class SocketModule {}
