const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const earningBefore21stDecembers = await DB.collection(COLLECTION.EARNING).find(
    { createdAt: { $lte: new Date('2022-12-20T16:59:59.999+0000') } }
  ).toArray();
  if (!earningBefore21stDecembers.length) return;

  await earningBefore21stDecembers.reduce(async (lastPromise, earning) => {
    await lastPromise;

    const details = await DB.collection(COLLECTION.EARNING).findOne({ _id: earning._id });
    if (!details) return Promise.resolve();

    return DB.collection(COLLECTION.EARNING).deleteOne({ _id: details._id });
  }, Promise.resolve());
};
