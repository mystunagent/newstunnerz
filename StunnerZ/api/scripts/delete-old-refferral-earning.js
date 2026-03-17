const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const referralEarningBefore21stDecembers = await DB.collection(
    COLLECTION.REFERRAL_EARNING
  ).find({ createdAt: { $lte: new Date('2022-12-20T16:59:59.999+0000') } }).toArray();
  if (!referralEarningBefore21stDecembers.length) return;
  await referralEarningBefore21stDecembers.reduce(async (lp, referralEarning) => {
    await lp;
    const details = await DB.collection(COLLECTION.REFERRAL_EARNING).findOne({ _id: referralEarning._id });
    if (!details) return Promise.resolve();
    return DB.collection(COLLECTION.REFERRAL_EARNING).deleteOne({ _id: details._id });
  }, Promise.resolve());
};
