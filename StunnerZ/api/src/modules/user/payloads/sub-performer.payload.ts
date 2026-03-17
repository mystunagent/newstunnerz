import {
  IsString, IsOptional, IsEmail, IsIn, Validate, IsNotEmpty,
  IsNumber
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { STATUSES } from '../constants';
import { Username } from '../validators/username.validator';

export class SubPerformerAuthCreatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsIn(STATUSES)
  status: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  commissionExternalAgency?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  setTypeCommissionAgency: string;
}
export class SubPerformerAuthUpdatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty()
  @IsString()
  @Validate(Username)
  @IsOptional()
  username: string;

  @ApiProperty()
  @IsString()
  @IsIn(STATUSES)
  status: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  commissionExternalAgency?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  setTypeCommissionAgency: string;
}
