import {
  Injectable, Inject, forwardRef
} from '@nestjs/common';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { SettingService } from 'src/modules/settings/services';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import { createHash } from 'crypto';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException } from 'src/kernel';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { BitsafePairingRequest, BitsafePairingRequestSuccessPostback } from '../payloads';
import { MissingConfigPaymentException } from '../exceptions';
import { BITSAFE_ACCOUNT_CONNECT_MODEL_PROVIDER } from '../providers';
import { BitsafeConnectAccountModel } from '../models';

@Injectable()
export class BitsafeService {
  constructor(
    @Inject(BITSAFE_ACCOUNT_CONNECT_MODEL_PROVIDER)
    private readonly ConnectAccountModel: Model<BitsafeConnectAccountModel>,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService
  ) {}

  async getPairingUrl(user: UserDto, req: BitsafePairingRequest) {
    const [verotelShopId, verotelSignatureKey] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.VEROTEL_SHOP_ID),
      SettingService.getValueByKey(SETTING_KEYS.VEROTEL_FLEXPAY_SIGNATURE_KEY)
    ]);
    if (!verotelShopId || !verotelSignatureKey) throw new MissingConfigPaymentException();
    const shasum = createHash('sha1');
    shasum.update(`${verotelSignatureKey}:pairingReference=${user._id}:platformConnectId=${verotelShopId}`);
    const signature = shasum.digest('hex');
    if (!req.isNew) {
      return { pairingUrl: `https://my.bitsafe.com/pairaccount?pairingReference=${user._id}&platformConnectId=${verotelShopId}&signature=${signature}` };
    }
    return { pairingUrl: `https://my.bitsafe.com/pairaccount/register?pairingReference=${user._id}&platformConnectId=${verotelShopId}&signature=${signature}` };
  }

  async successPairingAccount(data: BitsafePairingRequestSuccessPostback) {
    const {
      pairingReference, publicToken, platformConnectId, email, iban, signature
    } = data;
    if (!pairingReference || !publicToken) throw new EntityNotFoundException();
    let item = await this.ConnectAccountModel.findOne({
      sourceId: pairingReference
    });
    if (!item) {
      item = new this.ConnectAccountModel();
    }
    item.sourceId = toObjectId(pairingReference);
    item.publicToken = publicToken;
    item.platformConnectId = platformConnectId;
    item.email = email;
    item.iban = iban;
    item.signature = signature;
    await item.save();

    const performer = await this.performerService.findOne({ _id: pairingReference });
    if (performer) {
      performer.completedAccount = !!(performer?.avatarId && performer?.verifiedEmail && performer?.verifiedDocument);
      await performer.save();
    }
  }

  async getTalentAccountConnect(sourceId: string | ObjectId): Promise<BitsafeConnectAccountModel> {
    return this.ConnectAccountModel.findOne({
      sourceId
    });
  }

  async findBySourceIds(ids: string[] | ObjectId[]): Promise<any[]> {
    const accounts = await this.ConnectAccountModel
      .find({
        sourceId: {
          $in: ids
        }
      });
    return accounts;
  }
}
