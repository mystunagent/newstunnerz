import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BitsafePairingRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  isNew: string;
}

export class BitsafePairingRequestSuccessPostback {
  pairingReference: string;

  platformConnectId: string;

  publicToken: string;

  email: string;

  iban: string;

  signature: string;
}
