import { Schema } from 'mongoose';

export const BankingSettingSchema = new Schema({
  type: {
    type: String,
    default: 'wire'
  },
  performerId: {
    type: Schema.Types.ObjectId,
    index: true
  },

  // sepa new fields
  sepa_beneficiary_iban: String,
  sepa_beneficiary_name: String,
  sepa_currency: String,

  // wire new fields
  beneficiary_name: String,
  beneficiary_street: String,
  beneficiary_city: String,
  beneficiary_postal_code: String,
  beneficiary_country_code: String,
  beneficiary_account: String,
  bic_code: String,
  intermediary_bank_bic_code: String,
  currency: String,

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
