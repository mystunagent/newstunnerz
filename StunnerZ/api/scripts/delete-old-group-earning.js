const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const groupEarningBefore21stDecembers = await DB.collection(
    COLLECTION.GROUP_EARNING
  ).find({ createdAt: { $lte: new Date('2022-12-20T16:59:59.999+0000') } }).toArray();
  if (!groupEarningBefore21stDecembers.length) return;
  await groupEarningBefore21stDecembers.reduce(async (lp, groupEarning) => {
    await lp;
    const details = await DB.collection(COLLECTION.GROUP_EARNING).findOne({ _id: groupEarning._id });
    if (!details) return Promise.resolve();
    return DB.collection(COLLECTION.GROUP_EARNING).deleteOne({ _id: details._id });
  }, Promise.resolve());
};
