import { SearchRequest } from 'src/kernel/common';
import { ObjectId } from 'mongodb';
import {
  IsOptional, IsArray, IsString, IsNotEmpty
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GroupEarningSearchRequestPayload extends SearchRequest {
  performerId?: string | ObjectId;

  subPerformerId?: string | ObjectId;

  sourceId?: string | ObjectId;

  type?: string; // sourceType

  fromDate?: string | Date;

  toDate?: string | Date;

  isPaid?: string;

  latestPayment?: string;

}

export class GroupEarningUpdateStatusPayload {
  @ApiProperty()
  @IsArray()
  @IsOptional()
  groupEarningIds: Array<string>[];

  @ApiProperty()
  @IsString()
  performerId: string;
}
