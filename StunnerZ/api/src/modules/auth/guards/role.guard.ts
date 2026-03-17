import {
  Injectable, CanActivate, ExecutionContext,
  Inject
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { intersection } from 'lodash';
import { STATUS } from 'src/kernel/constants';
import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { AuthService } from '../services';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    @Inject(MONGO_DB_PROVIDER)
    private readonly connection: Connection
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization || request?.query?.authorization || request?.query?.Authorization;
    if (!token) return false;
    const deCodded = this.authService.verifyJWT(token);
    if (!deCodded) {
      return false;
    }
    const user = await this.authService.getSourceFromJWT(token) || request.user;
    if (!user || user?.status !== STATUS.ACTIVE) return false;
    request.user = user;
    request.authUser = {
      ...request.authUser,
      ...deCodded,
      sourceId: deCodded.mainSourceId || deCodded.sourceId
    };
    request.jwToken = token;
    if (user.isPerformer && roles.includes('performer')) {
      if (deCodded.mainSourceId) {
        // const subAccount = await this.userService.findById(deCodded.sourceId);
        const subAccount = await this.connection.model('User').findById(deCodded.sourceId) as any;
        if (!subAccount || subAccount.status !== STATUS.ACTIVE) return false;
        const newToken = await this.authService.getMainAccountToken(deCodded);
        request.jwToken = newToken;
        const newUser = await this.authService.getMainAccount(deCodded);
        request.user = newUser;
        const privileges = this.reflector.get<string[]>('privileges', context.getHandler());
        if (!privileges) {
          return true;
        }
        const myPrivileges = await this.connection.model('SubPerformerPrivilege').find({ userId: deCodded.sourceId });
        const privilegesDiff = intersection(myPrivileges.map((a: any) => a.privilege), privileges);
        if (privilegesDiff.length > 0) return true;
      } else {
        return true;
      }
    }
    if (!roles.includes('performer') && user.status === STATUS.INACTIVE) return false;
    const diff = intersection(user.roles, roles);
    return diff.length > 0;
  }
}
