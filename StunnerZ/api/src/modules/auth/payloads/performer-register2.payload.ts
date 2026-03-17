import {
  IsString,
  IsOptional,
  Validate,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsObject
} from 'class-validator';
import { Username } from 'src/modules/user/validators/username.validator';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';

export class PerformerRegister2Payload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  avatarId?: ObjectId;

  @ApiProperty()
  @IsString()
  @IsOptional()
  coverId?: ObjectId;

  @ApiProperty()
  @IsString()
  @IsOptional()
  welcomeVideoId?: ObjectId;

  @ApiProperty()
  @IsOptional()
  @IsString()
  referrerId: string | ObjectId;

  @ApiProperty()
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sexualOrientation?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  bankingInfo: any;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsObject()
  // sepaBankingInfo: any;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsObject()
  // wireBankingInfo: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  pricingInfo: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  twitterUrl: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  instagramUrl: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  websiteUrl: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  rel: string;
}
