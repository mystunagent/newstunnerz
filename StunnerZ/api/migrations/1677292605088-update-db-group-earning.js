const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  const groupEarning = await DB.collection(COLLECTION.GROUP_EARNING).find().toArray();
  await groupEarning.reduce(async (lp, group) => {
    await lp;
    if (group.isPaid) return Promise.resolve();
    const details = await DB.collection(COLLECTION.GROUP_EARNING).findOne({ _id: group._id });
    if (!details) return Promise.resolve();
    return DB.collection(COLLECTION.GROUP_EARNING).updateOne({ _id: details._id }, {
      $set: {
        isPaid: details.isPaid || false
      }
    });
  }, Promise.resolve());
  next();
};

module.exports.down = function down(next) {
  next();
};
