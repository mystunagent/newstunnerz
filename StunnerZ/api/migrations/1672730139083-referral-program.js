/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  PERFORMER_TO_PERFORMER_REFERRAL_COMMISSION: 'p2pReferralCommission',
  PERFORMER_TO_USER_REFERRAL_COMMISSION: 'p2uReferralCommission',
  USER_TO_PERFORMER_REFERRAL_COMMISSION: 'u2pReferralCommission',
  USER_TO_USER_REFERRAL_COMMISSION: 'u2uReferralCommission'
};

const settings = [
  {
    key: SETTING_KEYS.PERFORMER_TO_PERFORMER_REFERRAL_COMMISSION,
    value: 0.05,
    name: 'Model refer a model',
    description: '0.05 means the model referral gets 5% on model revenue for 1 year',
    public: true,
    group: 'commission',
    editable: true,
    type: 'number'
  },
  {
    key: SETTING_KEYS.PERFORMER_TO_USER_REFERRAL_COMMISSION,
    value: 0.05,
    name: 'Model refer a fan',
    description: '0.05 means the model referral gets 1% on fan spends for 1 year',
    public: true,
    group: 'commission',
    editable: true,
    type: 'number'
  },
  {
    key: SETTING_KEYS.USER_TO_PERFORMER_REFERRAL_COMMISSION,
    value: 0.01,
    name: 'Fan refer a model',
    description: '0.01 means the fan referral gets 1% on model revenue',
    public: true,
    group: 'commission',
    editable: true,
    type: 'number'
  },
  {
    key: SETTING_KEYS.USER_TO_USER_REFERRAL_COMMISSION,
    value: 0.01,
    name: 'Fan refer a fan',
    description: '0.01 means the fan referral gets 1% on fan spends',
    public: true,
    group: 'commission',
    editable: true,
    type: 'number'
  }
];

module.exports.up = async function up(next) {
  console.log('Update referral commission settings');

  // eslint-disable-next-line no-restricted-syntax
  for (const setting of settings) {
    const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
      key: setting.key
    });
    if (!checkKey) {
      await DB.collection(COLLECTION.SETTING).insertOne({
        ...setting,
        type: setting.type || 'text',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Inserted setting: ${setting.key}`);
    } else {
      console.log(`Setting: ${setting.key} exists`);
    }
  }

  await DB.collection(COLLECTION.SETTING).deleteOne({
    key: 'referralFee'
  });
  console.log('Remove old referral commission settings');
  console.log('Update referral commission settings');
  next();
};

module.exports.down = function down(next) {
  next();
};
