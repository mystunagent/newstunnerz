const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  JUMIO_TOKEN_API: 'jumioTokenApi',
  JUMIO_TOKEN_SECRET: 'jumioTokenSecret'
};

const data = [
  {
    key: SETTING_KEYS.JUMIO_TOKEN_API,
    value: '713372f6-8bf4-4ef8-949d-fcd816a6cd57',
    name: 'Jumio Token API Key',
    description: 'Jumio token API key. This key use to get authorization from Jumio',
    public: false,
    type: 'text',
    group: 'jumio',
    editable: true
  },
  {
    key: SETTING_KEYS.JUMIO_TOKEN_SECRET,
    value: 'Pwe0nY1Ls4A1tCjSOPN1vq69tjIJGbqF',
    name: 'Jumio Token Secret Key',
    description: 'Jumio token secret key. This key use to get authorization from Jumio',
    public: false,
    type: 'text',
    group: 'jumio',
    editable: true
  }
];

module.exports.up = async function up(next) {
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
  console.log('done');
  next();
};

module.exports.down = function dow(next) {
  next();
};
