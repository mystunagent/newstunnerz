import {
  IsString, IsOptional, ValidateIf, IsNotEmpty, IsNumber
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MESSAGE_TYPE } from '../constants';

export class MessageCreatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  type = MESSAGE_TYPE.TEXT;

  @ApiProperty()
  @ValidateIf((o) => o.type === MESSAGE_TYPE.TEXT)
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  price: number;
}
