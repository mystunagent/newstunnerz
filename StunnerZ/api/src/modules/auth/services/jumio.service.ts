/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import {
  Injectable, Inject, forwardRef, HttpException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { PerformerService } from 'src/modules/performer/services';
import axios from 'axios';
import { SettingService } from 'src/modules/settings';
import { PERFORMER_MODEL_PROVIDER } from 'src/modules/performer/providers';
import { PerformerModel } from 'src/modules/performer/models';
// import { BitsafeService } from 'src/modules/payment/services';
import { JumioCreationPayload, JumioCallbackPayload, JumioRetrievalPayload } from '../payloads';

@Injectable()
export class JumioService {
  constructor(
    // @Inject(forwardRef(() => BitsafeService))
    // private readonly bitsafeService: BitsafeService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>
  ) { }

  /**
   * generate password salt
   * @param byteSize integer
   */

  public async createAccount(payload: JumioCreationPayload) {
    const apiKey = await this.settingService.getKeyValue(SETTING_KEYS.JUMIO_TOKEN_API) || process.env.JUMIO_TOKEN_API;
    const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.JUMIO_TOKEN_SECRET) || process.env.JUMIO_TOKEN_SECRET;
    const resourceUrl = 'https://account.emea-1.jumio.ai/api/v1/accounts';
    const postData = {
      customerInternalReference: payload.userId,
      userReference: payload.userId,
      workflowDefinition: {
        key: 3,
        credentials: [{
          category: 'ID',
          type: {
            values: ['ID_CARD']
          }
        }]
      },
      // only available with real url, localhost has to use ngrok to testing
      callbackUrl: `${process.env.BASE_URL}/jumio/callback`,
      web: {
        locale: 'en-GB',
        /**
         * If these parameters are not provided,
         * and the values are not present in the Customer Portal settings,
         * the end user will be shown a success or error page instead.
         * */
        // only available with real url, localhost has to use ngrok to testing
        successUrl: `${process.env.USER_URL}/model/account`
        // errorUrl: 'https://stunnerz.com/error'
      }
    };

    const Authorization = `basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Stunnerz stunnerz/v1.0',
      Authorization
    };
    return new Promise((resolver, reject) => {
      axios.post(resourceUrl, postData, { headers })
        .then(async (response) => {
          const { data } = response;
          await this.performerModel.updateOne(
            { _id: payload.userId },
            {
              jumioMetadata: data,
              jumioAccountId: data?.account?.id,
              jumioWorkflowId: data?.workflowExecution?.id
            }
          );
          resolver(data);
        })
        .catch((e) => {
          console.log(e);
          reject(e);
        });
    });
  }

  public async callback(payload: JumioCallbackPayload) {
    try {
      const { workflowExecution, account, userReference } = payload;
      if (workflowExecution.status !== 'PROCESSED' || !workflowExecution.href) {
        return false;
      }
      const apiKey = await this.settingService.getKeyValue(SETTING_KEYS.JUMIO_TOKEN_API) || process.env.JUMIO_TOKEN_API;
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.JUMIO_TOKEN_SECRET) || process.env.JUMIO_TOKEN_SECRET;
      const Authorization = `basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Stunnerz stunnerz/v1.0',
        Authorization
      };

      const resp = await axios.get(workflowExecution.href, { headers });
      const { capabilities } = resp.data;
      if (!capabilities) {
        return false;
      }

      // Checking capabilities status of workflow
      const {
        usability, imageChecks, extraction, dataChecks, similarity, liveness
      } = capabilities;
      if (!usability) {
        return false;
      }
      const usabilityStatus = usability.filter((u) => u.decision.type !== 'PASSED' && u.decision.type !== 'WARNING').length === 0;

      if (!usabilityStatus || !similarity || !liveness || !imageChecks) {
        return false;
      }
      const similarityStatus = similarity.filter((u) => u.decision.type !== 'PASSED' && u.decision.type !== 'WARNING').length === 0;

      const livenessStatus = liveness.filter((u) => u.decision.type !== 'PASSED' && u.decision.type !== 'WARNING').length === 0;

      const imageChecksStatus = imageChecks.filter((u) => u.decision.type !== 'PASSED' && u.decision.type !== 'WARNING').length === 0;

      if (!imageChecksStatus || !extraction) {
        return false;
      }
      const extractionStatus = extraction.filter((u) => u.decision.type !== 'PASSED' && u.decision.type !== 'WARNING').length === 0;

      if (!extractionStatus || !dataChecks) {
        return false;
      }
      const dataChecksStatus = dataChecks.filter((u) => u.decision.type !== 'PASSED' && u.decision.type !== 'WARNING').length === 0;
      // end checking
      const performer = await this.performerModel.findOne({
        $or: [
          {
            _id: userReference
          },
          {
            jumioAccountId: account.id
          },
          {
            jumioWorkflowId: workflowExecution.id
          }
        ]
      });
      if (!performer || !performer._id) {
        return false;
      }

      performer.verifiedDocument = !!(similarityStatus && livenessStatus && dataChecksStatus);

      const bankingInformation = await this.performerService.getBankInfo(performer._id);
      performer.completedAccount = !!(bankingInformation?._id);

      await performer.save();

      return resp.data;
    } catch (e) {
      throw new HttpException(e, 400);
    }
  }

  public async retrieval(payload: JumioRetrievalPayload) {
    try {
      const apiKey = await this.settingService.getKeyValue(SETTING_KEYS.JUMIO_TOKEN_API) || process.env.JUMIO_TOKEN_API;
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.JUMIO_TOKEN_SECRET) || process.env.JUMIO_TOKEN_SECRET;
      const resourceUrl = `
      https://retrieval.emea-1.jumio.ai/api/v1/accounts/${payload.accountId}/workflow-executions/${payload.workflowExecutionId}/${payload.isStatus ? 'status' : ''}
      `;
      const Authorization = `basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Stunnerz stunnerz/v1.0',
        Authorization
      };
      return new Promise((resolver, reject) => {
        axios.get(resourceUrl, { headers }).then((response) => {
          resolver(response.data);
        })
          .catch((e) => {
            reject(e.response.data);
          });
      });
    } catch (e) {
      throw new HttpException(e, 400);
    }
  }
}
