import { ApiProperty } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject
} from 'class-validator';

export class JumioCreationPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;
}
export class JumioCallbackPayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  callbackSentAt: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userReference: string;

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  account: {
    id: string;
    href: string;
  };

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  workflowExecution: {
    id: string;
    href: string;
    definitionKey: string;
    status: 'PROCESSED'| 'SESSION_EXPIRED'| 'TOKEN_EXPIRED';
  };
}

export class JumioRetrievalPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workflowExecutionId: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isStatus: boolean;
}
