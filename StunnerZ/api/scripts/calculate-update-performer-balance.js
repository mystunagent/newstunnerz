const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const performers = await DB.collection(COLLECTION.PERFORMER).find().toArray();
  if (!performers.length) return;

  await performers.reduce(async (lastPromise, performer) => {
    await lastPromise;

    const details = await DB.collection(COLLECTION.PERFORMER).findOne({ _id: performer._id });
    if (!details) return Promise.resolve();

    const totalEarnNet = await DB.collection(COLLECTION.EARNING).aggregate([
      {
        $match: {
          performerId: details._id,
          isPaid: false
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$netPrice'
          }
        }
      }
    ]).toArray();

    const totalRefNetPrice = await DB.collection(COLLECTION.EARNING).aggregate([
      {
        $match: {
          referralId: details._id,
          referralSource: 'performer',
          isPaid: false
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$netPrice'
          }
        }
      }
    ]).toArray();

    const totalEarn = (totalEarnNet
      && totalEarnNet.length
      && totalEarnNet[0].total)
      || 0;

    const totalRef = (totalRefNetPrice
      && totalRefNetPrice.length
      && totalRefNetPrice[0].total)
      || 0;

    const balance = totalEarn + totalRef;
    return DB.collection(COLLECTION.PERFORMER).updateOne(
      { _id: performer._id },
      {
        $set: {
          balance
        }
      }
    );
  }, Promise.resolve());
};
