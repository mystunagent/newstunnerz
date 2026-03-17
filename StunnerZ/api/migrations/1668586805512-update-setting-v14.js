const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update verotel settings group');
  await DB.collection(COLLECTION.SETTING).updateMany(
    { group: 'verotel' },
    {
      $set: {
        group: 'paymentGateways'
      }
    }
  );
  console.log('Update verotel settings group are done');
  console.log('Remove old unused settings');
  await DB.collection(COLLECTION.SETTING).deleteMany({
    $or: [
      { group: 'ccbill' },
      { group: 'stripe' },
      { group: 'ant' },
      {
        group: 'commission',
        key: {
          $nin: ['referralFee', 'transactionCost', 'performerCommission']
        }
      },
      { key: 'tokenConversionRate' },
      { key: 'verotelEnabled' },
      { key: 'referralFee' }
    ]
  });
  // eslint-disable-next-line no-console
  console.log('Remove old unused settings are done');
  next();
};

module.exports.down = function down(next) {
  next();
};
