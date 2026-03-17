import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  Param
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { TokenTransactionStreamService } from '../services/token-transaction-stream.service';

@Injectable()
@Controller('wallet/charges')
export class PaymentTokenStreamController {
  constructor(private readonly tokenTransactionStreamService: TokenTransactionStreamService) { }

  @Get('/search/earning/:conversationId')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchEarningStream(
    @Param('conversationId') conversationId: string
  ): Promise<any> {
    const data = await this.tokenTransactionStreamService.statEarningLiveStream(conversationId);
    return DataResponse.ok(data);
  }
}
