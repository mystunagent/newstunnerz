/**
 * Document: https://github.com/Jumio/implementation-guides/blob/master/api-guide/api_guide.md
 * Demo: https://share.vidyard.com/watch/79p6mLKz9a9eDyz69Wui2X
 * Workflow:
 * 1. Account creation: Create web href to verify ID, save account Id and workflow Id
 * 2. Config customer portal - https://customer-portal.lon.netverify.com/#/login: callback url, success url, error url, form, etc...
 * 3. Run callbackUrl to update related data
 * 4. If user is verified -> return success url
 * 5. Else -> return error url or error dashboard of Jumio
 */

import {
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  HttpCode,
  HttpStatus,
  Controller,
  forwardRef,
  Inject
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { JumioService } from '../services';
import { JumioCreationPayload, JumioCallbackPayload, JumioRetrievalPayload } from '../payloads';

@Controller('jumio')
export class JumioController {
  constructor(
    @Inject(forwardRef(() => JumioService))
    private readonly jumioService: JumioService
  ) {}

  @Post('account-creation')
  @HttpCode(HttpStatus.OK)
  async createAccount(
    @Body() payload: JumioCreationPayload
  ): Promise<DataResponse<any>> {
    const response = await this.jumioService.createAccount(payload);
    return DataResponse.ok(response);
  }

  @Post('/callback')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async callback(
    @Body() payload:JumioCallbackPayload
  ): Promise<DataResponse<any>> {
    const response = await this.jumioService.callback(payload);
    return DataResponse.ok(response);
  }

  @Post('retrieval')
  @HttpCode(HttpStatus.OK)
  async retrieval(
    @Body() payload: JumioRetrievalPayload
  ): Promise<DataResponse<any>> {
    const response = await this.jumioService.retrieval(payload);
    return DataResponse.ok(response);
  }
}
