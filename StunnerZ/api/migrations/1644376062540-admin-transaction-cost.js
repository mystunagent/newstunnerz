const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  TRANSACTION_COST: 'transactionCost'
};

const settings = [
  {
    key: SETTING_KEYS.TRANSACTION_COST,
    value: 0.04,
    name: 'Transaction cost',
    description: 'Transaction cost is 0.01 to 0.99 (1%-99%)',
    public: false,
    group: 'commission',
    editable: true,
    type: 'number'
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate admin transaction cost');

  // eslint-disable-next-line no-restricted-syntax
  for (const setting of settings) {
    // eslint-disable-next-line no-await-in-loop
    const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
      key: setting.key
    });
    if (!checkKey) {
      // eslint-disable-next-line no-await-in-loop
      await DB.collection(COLLECTION.SETTING).insertOne({
        ...setting,
        type: setting.type || 'text',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      // eslint-disable-next-line no-console
      console.log(`Inserted setting: ${setting.key}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('Migrate subscription settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};
