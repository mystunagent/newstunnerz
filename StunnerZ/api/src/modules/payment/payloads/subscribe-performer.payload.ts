import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribePerformerPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  performerId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsIn(['trial', 'monthly', 'six_month', 'one_time'])
  type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsIn(['verotel']) // only verotel payment gateway for stunnerzs
  paymentGateway: string;
}
