import {
  IsString,
  IsNotEmpty
} from 'class-validator';
import { ObjectId } from 'mongodb';

export class PaymentGatewaySettingPayload {
  @IsString()
  performerId: string | ObjectId;

  @IsString()
  key = 'verotel';

  @IsString()
  status = 'active';

  @IsNotEmpty()
  value: any;
}
