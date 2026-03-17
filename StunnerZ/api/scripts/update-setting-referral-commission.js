/* eslint-disable no-await-in-loop */
const {
  DB, COLLECTION
} = require('../migrations/lib');

module.exports = async () => {
  const SETTING_KEYS = {
    PERFORMER_TO_USER_REFERRAL_COMMISSION: 'p2uReferralCommission'
  };
  const detail = await DB.collection(COLLECTION.SETTING).findOne({
    key: SETTING_KEYS.PERFORMER_TO_USER_REFERRAL_COMMISSION
  });
  if (!detail) return;
  await DB.collection(COLLECTION.SETTING).updateOne(
    { _id: detail._id },
    {
      $set: {
        description: '0.05 means the model referral gets 5% on fan spends for 1 year'
      }
    }
  );
};
