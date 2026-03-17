const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  REFERRAL_FEE: 'referralFee'
};

const settings = [
  {
    key: SETTING_KEYS.REFERRAL_FEE,
    value: 0.03,
    name: 'Internal Referral Fee %',
    description: 'Referral Fee % is 0.01 to 0.10 (1%-10%)',
    public: false,
    group: 'commission',
    editable: true,
    type: 'number',
    meta: {
      min: 0.01,
      max: 0.1,
      step: 0.01
    }
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate internal referral fee');

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
