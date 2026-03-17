const {
  DB, COLLECTION
} = require('../migrations/lib');

async function checkAccount(modelId) {
  const banking = await DB.collection(COLLECTION.PERFORMER_BANKING).findOne({
    performerId: modelId
  });
  if (banking) {
    await DB.collection(COLLECTION.PERFORMER).updateOne({
      _id: modelId
    }, {
      $set: {
        completedAccount: true
      }
    });
  } else {
    console.log(`${modelId} didn't enter banking info`);
  }
}

module.exports = async () => {
  const models = await DB.collection(COLLECTION.PERFORMER).find({
    verifiedDocument: true,
    $or: [
      { completedAccount: false },
      { completedAccount: null }
    ]
  }).toArray();
  // console.log(models[0]);
  // eslint-disable-next-line no-restricted-syntax
  for (const model of models) {
    // eslint-disable-next-line no-await-in-loop
    await checkAccount(model._id);
  }
};
