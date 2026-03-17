import {
  Injectable, CanActivate, ExecutionContext,
  Inject
} from '@nestjs/common';
import { STATUS } from 'src/kernel/constants';
import { Reflector } from '@nestjs/core';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { Connection } from 'mongoose';
import { intersection } from 'lodash';
import { AuthService } from '../services';

@Injectable()
export class LoadUser implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
    @Inject(MONGO_DB_PROVIDER)
    private readonly connection: Connection
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization || request.query.Authorization;
    if (!token || token === 'null') return true;

    const user = request.user
      || (await this.authService.getSourceFromJWT(token));
    if (!user || user.status !== STATUS.ACTIVE) {
      return false;
    }
    if (!request.user) request.user = user;

    const deCodded = this.authService.verifyJWT(token);
    if (!deCodded) {
      return false;
    }
    request.authUser = {
      ...request.authUser,
      ...deCodded,
      sourceId: deCodded.mainSourceId || deCodded.sourceId
    };
    request.jwToken = token;
    if (deCodded.mainSourceId) {
      const newToken = await this.authService.getMainAccountToken(deCodded);
      const newUser = await this.authService.getMainAccount(deCodded);
      request.user = newUser;
      request.jwToken = newToken;
      request.authUser = {
        ...request.authUser,
        ...deCodded,
        sourceId: deCodded.mainSourceId || deCodded.sourceId
      };
      const privileges = this.reflector.get<string[]>('privileges', context.getHandler());
      if (!privileges) {
        return true;
      }
      const myPrivileges = await this.connection.model('SubPerformerPrivilege').find({ userId: deCodded.sourceId });
      const privilegesDiff = intersection(myPrivileges.map((a: any) => a.privilege), privileges);
      if (privilegesDiff.length > 0) return true;
    }
    return true;
  }
}
