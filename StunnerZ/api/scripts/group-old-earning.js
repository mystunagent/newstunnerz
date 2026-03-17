const { DB, COLLECTION } = require('../migrations/lib');

async function createGroupEarning(earning, performerId, sourceType) {
  const checkGroupEarning = await DB.collection(
    COLLECTION.GROUP_EARNING
  ).findOne({ sourceId: earning._id });

  if (checkGroupEarning) {
    return;
  }

  await DB.collection(COLLECTION.GROUP_EARNING).insertOne({
    sourceId: earning._id,
    performerId,
    sourceType,
    createdAt: earning.createdAt
  });
}

module.exports = async () => {
  const earnings = await DB.collection(COLLECTION.EARNING)
    .find({})
    .toArray();
  // eslint-disable-next-line no-restricted-syntax
  for (const earning of earnings) {
    // eslint-disable-next-line no-await-in-loop
    earning?.performerId && earning?.type && await createGroupEarning(earning, earning?.performerId, earning?.type);
  }

  // only get referral earning of referral is performer
  const referralEarnings = await DB.collection(COLLECTION.REFERRAL_EARNING)
    .find({ referralSource: 'performer' })
    .toArray();

  // eslint-disable-next-line no-restricted-syntax
  for (const refEarnings of referralEarnings) {
    // eslint-disable-next-line no-await-in-loop
    refEarnings?.referralId && await createGroupEarning(refEarnings, refEarnings?.referralId, 'referral');
  }
  console.log('Create all group earnings by old earnings');
};
