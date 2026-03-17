import {
  IsString, IsNotEmpty, IsOptional, ValidateIf
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { MESSAGE_TYPE } from '../constants';

export class MassMessagePayload {
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
  @IsNotEmpty()
  @IsString()
  recipients: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fileId: string | ObjectId;
}
