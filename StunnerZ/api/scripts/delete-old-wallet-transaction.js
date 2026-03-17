const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const walletTransactionsBefore21stDecembers = await DB.collection(
    COLLECTION.PURCHASED_ITEMS
  ).find({ createdAt: { $lte: new Date('2022-12-20T16:59:59.999+0000') } }).toArray();
  if (!walletTransactionsBefore21stDecembers.length) return;
  await walletTransactionsBefore21stDecembers.reduce(async (lp, walletTransactions) => {
    await lp;
    const details = await DB.collection(COLLECTION.PURCHASED_ITEMS).findOne({ _id: walletTransactions._id });
    if (!details) return Promise.resolve();
    return DB.collection(COLLECTION.PURCHASED_ITEMS).deleteOne({ _id: details._id });
  }, Promise.resolve());
};
