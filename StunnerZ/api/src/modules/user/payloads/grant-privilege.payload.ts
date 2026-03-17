import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class GrantPrivilegePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  privilege: string;

  @ApiProperty()
  @IsOptional()
  commission: number;
}
export class SearchPrivilegePayload extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  userId: string;
}
