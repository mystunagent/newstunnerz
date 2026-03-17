import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  Query,
  Response
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import {
  BitsafePairingRequest, BitsafePairingRequestSuccessPostback
} from '../payloads';
import { UserDto } from '../../user/dtos';
import { BitsafeService } from '../services';

@Injectable()
@Controller('bitsafe')
export class BitsafeController {
  constructor(
    private readonly bitsafeService: BitsafeService
  ) { }

  @Get('/pairing-account')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getPairingUrl(
    @CurrentUser() user: UserDto,
    @Query() req: BitsafePairingRequest
  ): Promise<DataResponse<any>> {
    // const data = await this.bitsafeService.getPairingUrl(user, req);
    // return DataResponse.ok(data);
    return DataResponse.ok({ message: 'Bitsafe is removed' });
  }

  @Get('/pairing-account/success')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async successParingAccount(
    @Query() req: BitsafePairingRequestSuccessPostback,
    @Response() res: any
  ) {
    // await this.bitsafeService.successPairingAccount(req);
    // res.setHeader('content-type', 'text/plain');
    // res.send('OK');
    return DataResponse.ok({ message: 'Bitsafe is removed' });
  }
}
