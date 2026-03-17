import { IsString, IsOptional } from 'class-validator';
import { SearchRequest } from 'src/kernel/common';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';

export class FeedSearchRequest extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  q: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  performerId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userPerformer: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  orientation: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fromDate: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  toDate: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  scheduleFrom: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  scheduleTo: string;

  @ApiProperty()
  @IsOptional()
  isFreeContent: boolean;

  @ApiProperty()
  @IsOptional()
  mostLike: boolean;

  ids?: string[] | ObjectId[];
}
