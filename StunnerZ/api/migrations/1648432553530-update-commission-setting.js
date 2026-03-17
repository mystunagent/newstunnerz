const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  PERFORMER_COMMISSION: 'performerCommission',
  ACCOUNT_MANAGER_COMMISSION: 'accountManagerCommission',
  EVENT_COMMISSION: 'eventCommission'
};

const settings = [
  {
    key: SETTING_KEYS.PERFORMER_COMMISSION,
    value: 0.1,
    name: 'Performer commission',
    description: '0.2 means the following split of earnings - platform gets 20%, user gets 80%',
    public: false,
    group: 'commission',
    editable: true,
    type: 'number'
  },
  {
    key: SETTING_KEYS.ACCOUNT_MANAGER_COMMISSION,
    value: 0.2,
    name: 'Account Manager Commission',
    description: 'Account manager gets 20%, performer gets 80%',
    public: true,
    group: 'commission',
    editable: true,
    type: 'number'
  },
  {
    key: SETTING_KEYS.EVENT_COMMISSION,
    value: 0.1,
    name: 'Event Commission',
    description: 'Performer pay 90%',
    public: true,
    group: 'commission',
    editable: true,
    type: 'number'
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update commission settings');

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
  console.log('Update commission settings');
  next();
};

module.exports.down = function down(next) {
  next();
};
