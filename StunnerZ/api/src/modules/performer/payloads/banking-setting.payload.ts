/* eslint-disable camelcase */
import {
  IsString, IsOptional
} from 'class-validator';

export class BankingSettingPayload {
  @IsString()
  @IsOptional()
  type: string;

  @IsString()
  @IsOptional()
  performerId: string;

  // sepa banking
  @IsString()
  @IsOptional()
  sepa_beneficiary_name: string;

  @IsString()
  @IsOptional()
  sepa_beneficiary_iban: string;

  @IsString()
  @IsOptional()
  sepa_currency: string;

  // wire banking
  @IsString()
  @IsOptional()
  beneficiary_name: string;

  @IsString()
  @IsOptional()
  beneficiary_street: string;

  @IsString()
  @IsOptional()
  beneficiary_city: string;

  @IsString()
  @IsOptional()
  beneficiary_postal_code: string;

  @IsString()
  @IsOptional()
  beneficiary_country_code: string;

  @IsString()
  @IsOptional()
  beneficiary_account: string;

  @IsString()
  @IsOptional()
  bic_code: string;

  @IsString()
  @IsOptional()
  intermediary_bank_bic_code: string;

  @IsString()
  @IsOptional()
  currency: string;
}
