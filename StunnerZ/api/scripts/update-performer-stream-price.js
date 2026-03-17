const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  const update = await DB.collection(COLLECTION.PERFORMER).updateMany(
    { publicChatPrice: { $lt: 10 } },
    {
      $set: {
        publicChatPrice: 10
      }
    }
  );
  console.log(update);
  console.log('All Models have been updated');
};
