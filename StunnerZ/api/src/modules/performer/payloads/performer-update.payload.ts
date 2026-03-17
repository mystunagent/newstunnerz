import {
  IsString,
  IsOptional,
  Validate,
  IsEmail,
  IsIn,
  IsArray,
  MinLength,
  Min,
  Max,
  IsNumber,
  IsBoolean,
  IsDateString
} from 'class-validator';
import { Username } from 'src/modules/user/validators/username.validator';
import { GENDERS } from 'src/modules/user/constants';
import { ApiProperty } from '@nestjs/swagger';
import { ACCOUNT_MANAGER, PERFORMER_STATUSES } from '../constants';

export class PerformerUpdatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

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
  @IsOptional()
  @Validate(Username)
  @IsOptional()
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @IsOptional()
  password: string;

  @ApiProperty()
  @IsString()
  @IsIn([PERFORMER_STATUSES.ACTIVE, PERFORMER_STATUSES.INACTIVE])
  @IsOptional()
  status = PERFORMER_STATUSES.ACTIVE;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneCode: string; // international code prefix

  @ApiProperty()
  @IsString()
  @IsOptional()
  avatarId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  coverId?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  verifiedEmail?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsIn([ACCOUNT_MANAGER.SELF_MANAGED, ACCOUNT_MANAGER.AGENCY_MANAGED, ACCOUNT_MANAGER.STUNNER_Z_MANAGED])
  accountManager?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  verifiedAccount?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  verifiedDocument?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  idVerificationId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  documentVerificationId: string;

  @ApiProperty()
  @IsString()
  @IsIn(GENDERS)
  @IsOptional()
  gender: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  state: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  zipcode: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  studioId: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  height: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  weight: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  hair?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  pubicHair?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
    breastSize?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  butt?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sentence?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ethnicity?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  bio: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  eyes: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sexualOrientation: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isTrialSubscription: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(3)
  @IsOptional()
  durationTrialSubscriptionDays: number;

  @ApiProperty()
  @IsNumber()
  @Min(1.99)
  @IsOptional()
  trialPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(2)
  @IsOptional()
  monthlyPrice: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isSixMonthSubscription: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(2)
  @IsOptional()
  sixMonthPrice: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isOneTimeSubscription: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(180)
  @Max(365)
  @IsOptional()
  durationOneTimeSubscriptionDays: number;

  @ApiProperty()
  @IsNumber()
  @Min(2)
  @Max(499)
  @IsOptional()
  oneTimePrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  publicChatPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  bookingStreamPrice?: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  privateChatPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  pricePerMinuteBookStream?: number;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  dateOfBirth: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  referrerId: string;

  commissionPercentage: number;

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
}

export class SelfUpdatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

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
  @MinLength(6)
  @IsOptional()
  password: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneCode: string; // international code prefix

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsIn(GENDERS)
  gender: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  state: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  zipcode: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  studioId: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  height: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  weight: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  hair?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  pubicHair?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  butt?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ethnicity?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  bio: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  eyes: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sexualOrientation: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isTrialSubscription: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(3)
  @IsOptional()
  durationTrialSubscriptionDays: number;

  @ApiProperty()
  @IsNumber()
  @Min(1.99)
  @IsOptional()
  trialPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(2)
  @IsOptional()
  monthlyPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(2)
  @IsOptional()
  sixMonthPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  publicChatPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  privateChatPrice: number;

  @ApiProperty()
  @IsOptional()
  bankingInfomation?: any;

  @ApiProperty()
  @IsOptional()
  activateWelcomeVideo?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  idVerificationId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  documentVerificationId: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  dateOfBirth: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  twitterUrl: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  instagramUrl: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  pricePerMinuteBookStream?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  websiteUrl: string;
}
