import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import {
  CurrentUser, UPDATE_SUB_ACCOUNT_EXCLUSIVE_FIELDS, Privileges, Roles
} from 'src/modules/auth';
import { DataResponse, EntityNotFoundException, getConfig } from 'src/kernel';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { PerformerDto } from 'src/modules/performer/dtos';
import { omit } from 'lodash';
import { AuthService } from 'src/modules/auth/services';
import { FileDto, FileUploaded, FileUploadInterceptor } from 'src/modules/file';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';
import { SubPerformerService, UserSearchService, UserService } from '../services';
import {
  GrantPrivilegePayload, SearchPrivilegePayload, SubPerformerAuthCreatePayload, SubPerformerAuthUpdatePayload,
  UserSearchRequestPayload
} from '../payloads';
import { UserDto } from '../dtos';
import { PERFORMER_PRIVILEGES } from '../constants';

@Controller('sub-performer')
export class SubPerformerController {
  constructor(
    private readonly subPerformerService: SubPerformerService,
    private readonly authService: AuthService,
    private readonly userSearchService: UserSearchService,
    private readonly userService: UserService
  ) { }

  @Post('/')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @Privileges(PERFORMER_PRIVILEGES.SUB_ACCOUNT)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createSubAccount(
    @Body() payload: SubPerformerAuthCreatePayload,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await omit(payload, UPDATE_SUB_ACCOUNT_EXCLUSIVE_FIELDS) as any;
    const sub = await this.subPerformerService.create(performer._id, data, performer);
    if (payload.password) {
      // generate auth if have pw, otherwise will create random and send to user email?
      await this.authService.update({
        type: 'password',
        value: payload.password,
        source: 'sub_performer',
        key: payload.email,
        sourceId: sub._id,
        mainSourceId: performer._id // use when account is sub account
      });
    }
    return DataResponse.ok(sub);
  }

  @Put('/:userId')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @Privileges(PERFORMER_PRIVILEGES.SUB_ACCOUNT)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateUser(
    @Body() payload: SubPerformerAuthUpdatePayload,
    @Param('userId') userId: string,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = omit(payload, UPDATE_SUB_ACCOUNT_EXCLUSIVE_FIELDS) as any;
    await this.subPerformerService.updateProfile(performer, userId, data);
    const sub = await this.subPerformerService.findById(userId);
    return DataResponse.ok(sub);
  }

  @Post('/privilege')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @Privileges(PERFORMER_PRIVILEGES.SUB_ACCOUNT)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async grantPrivilege(
    @Body() payload: GrantPrivilegePayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const privilege = await this.subPerformerService.grant(user, payload);
    return DataResponse.ok(privilege);
  }

  @Delete('/privilege/:id')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @Privileges(PERFORMER_PRIVILEGES.SUB_ACCOUNT)
  async removePrivilege(@Param('id') id: string) {
    const resp = await this.subPerformerService.remove(id);
    return DataResponse.ok(resp);
  }

  @Get('/:userId/view')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @Privileges(PERFORMER_PRIVILEGES.SUB_ACCOUNT)
  async getDetails(
    @Param('userId') userId: string
  ): Promise<DataResponse<any>> {
    const sub = await this.subPerformerService.findById(userId);
    // TODO - check roles or other to response info
    return DataResponse.ok(sub);
  }

  @Get('/accounts')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @Privileges(PERFORMER_PRIVILEGES.SUB_ACCOUNT)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true
    }))
  async searchSubAccounts(
    @CurrentUser() user: UserDto,
    @Query() payload: UserSearchRequestPayload
  ): Promise<any> {
    const resp = await this.userSearchService.searchPerformerSubAccount(user, payload);
    return DataResponse.ok(resp);
  }

  @Get('/privileges/search')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @Privileges(PERFORMER_PRIVILEGES.SUB_ACCOUNT)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true
    }))
  async searchAccountPrivileges(
    @Query() payload: SearchPrivilegePayload
  ): Promise<any> {
    const resp = await this.subPerformerService.search(payload);
    return DataResponse.ok(resp);
  }

  @Post('/switch-account')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @Privileges(PERFORMER_PRIVILEGES.SUB_ACCOUNT)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async switchAccount(
    @Body() payload: SubPerformerAuthCreatePayload,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    await this.subPerformerService.switchAccountSubPerformer(performer, payload);
    const subPerformer = await this.userService.findOne({ username: payload.username, mainSourceId: performer._id, usingSubAccount: true });
    return DataResponse.ok(subPerformer);
  }

  @Get('/privilege/my-list')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async myPrivilege(
    @CurrentUser() user: UserDto,
    @Query() payload: SearchPrivilegePayload
  ): Promise<any> {
    const resp = await this.subPerformerService.myList(user, payload);
    return DataResponse.ok(resp);
  }

  @Post('/privilege/change-total-commission')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async changeTotalCommission(
    @CurrentUser() performer: any,
    @Body() payload: any
  ): Promise<any> {
    const resp = await this.subPerformerService.updateCommissionAgency(payload, performer);
    return DataResponse.ok(resp);
  }

  // @Post('/:id/avatar-sub/upload')
  // @HttpCode(HttpStatus.OK)
  // @Roles('performer')
  // @UseGuards(RoleGuard)
  // @Privileges(PERFORMER_PRIVILEGES.SUB_ACCOUNT)
  // @UseInterceptors(
  //   FileUploadInterceptor('avatar', 'avatar', {
  //     destination: getConfig('file').avatarDir,
  //     uploadImmediately: true,
  //     acl: S3ObjectCannelACL.PublicRead,
  //     server: Storage.S3
  //     })
  // )
  // async uploadUserAvatar(
  //   @Param('id') userId: string,
  //   @FileUploaded() file: FileDto
  // ): Promise<any> {
  //   const user = await this.userService.findById(userId);
  //   if (!user) {
  //     throw new EntityNotFoundException();
  //   }
  //   await this.userService.updateAvatar(new UserDto(user), file);
  //   return DataResponse.ok({
  //     success: true,
  //     url: file.getUrl()
  //   });
  // }
}
