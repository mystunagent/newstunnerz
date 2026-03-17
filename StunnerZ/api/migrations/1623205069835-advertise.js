const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  ADVERTISE_CONTENT: 'advertiseContent'
};

const data = [
  {
    key: SETTING_KEYS.ADVERTISE_CONTENT,
    value: '',
    name: 'Advertise Content',
    description: 'Advertise Content',
    public: true,
    type: 'textarea',
    group: 'advertise',
    editable: true
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update Advertise Settings');

  // eslint-disable-next-line no-restricted-syntax
  for (const setting of data) {
    // eslint-disable-next-line no-await-in-loop
    const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
      key: setting.key
    });
    if (!checkKey) {
      // eslint-disable-next-line no-await-in-loop
      await DB.collection(COLLECTION.SETTING).insertOne({
        ...setting,
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
  console.log('done');
  next();
};

module.exports.down = function dow(next) {
  next();
};
