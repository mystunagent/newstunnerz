/* eslint-disable camelcase */
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class BankingModel extends Document {
  type: string;

  performerId: ObjectId;

  // sepa new fields
  sepa_beneficiary_name: string;

  sepa_beneficiary_iban: string;

  sepa_currency: string;

  // wire new fields
  beneficiary_name: string;

  beneficiary_street: string;

  beneficiary_city: string;

  beneficiary_postal_code: string;

  beneficiary_country_code: string;

  beneficiary_account: string;

  bic_code: string;

  intermediary_bank_bic_code: string;

  currency: string;

  createdAt: Date;

  updatedAt: Date;
}
