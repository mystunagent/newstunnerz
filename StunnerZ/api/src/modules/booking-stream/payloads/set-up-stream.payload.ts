import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';
import { SearchRequest } from 'src/kernel';
import { SetUpTimeStreamStatus, SETUP_TIME_STREAM_STATUES, SearchSetUpTimeStreamStatus, SEARCH_SETUP_TIME_STREAM_STATUES } from '../constants';

export class CreateSetupTimeStreamPayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startAt: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endAt: Date;
}

export class UpdateSetupTimeStreamPayload extends CreateSetupTimeStreamPayload {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsIn(SETUP_TIME_STREAM_STATUES)
  status: SetUpTimeStreamStatus;
}
export class SetUpTimeStreamSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsIn(SEARCH_SETUP_TIME_STREAM_STATUES)
  status?: SearchSetUpTimeStreamStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()
  performerId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  startAt: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  endAt: string;
}
