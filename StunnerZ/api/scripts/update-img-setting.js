const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  await DB.collection(COLLECTION.SETTING).updateOne(
    {
      key: 'loginPlaceholderImage'
    },
    {
      $set: {
        meta: {
          upload: true,
          image: true,
          video: true
        },
        name: 'Left media content (login page)',
        description: 'Video or Image in left side of login page'
      }
    }
  );
  console.log('Updated setting');
};
