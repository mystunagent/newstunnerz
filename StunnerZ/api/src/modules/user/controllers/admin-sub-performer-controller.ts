import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import {
  Roles
} from 'src/modules/auth';
import { DataResponse } from 'src/kernel';
import { RoleGuard } from 'src/modules/auth/guards';
import { AuthService } from 'src/modules/auth/services';
import { SubPerformerService, UserSearchService, UserService } from '../services';
import {
  
  UserSearchRequestPayload
} from '../payloads';

@Controller('admin/sub-performer')
export class AdminSubPerformerController {
  constructor(
    private readonly subPerformerService: SubPerformerService,
    private readonly authService: AuthService,
    private readonly userSearchService: UserSearchService,
    private readonly userService: UserService
  ) { }

  @Get('/accounts')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true
    }))
  async adminSearchSubAccounts(
    @Query() payload: UserSearchRequestPayload
  ): Promise<any> {
    const resp = await this.userSearchService.adminSearchPerformerSubAccount(payload);
    return DataResponse.ok(resp);
  }
}
