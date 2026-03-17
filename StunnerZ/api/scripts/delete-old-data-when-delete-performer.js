const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  // delete old feed
  const feeds = await DB.collection(COLLECTION.FEEDS).find({}).toArray();
  if (!feeds.length) return;

  await feeds.reduce(async (lastPromise, feed) => {
    await lastPromise;
    const details = await DB.collection(COLLECTION.PERFORMER).findOne({ _id: feed.fromSourceId });

    if (!details) {
      await
      DB.collection(COLLECTION.FEEDS).deleteMany({ fromSourceId: feed.fromSourceId });
    }
  }, Promise.resolve());

  // delete old video
  const videos = await DB.collection(COLLECTION.PERFORMER_VIDEO).find({}).toArray();

  if (!videos.length) return;

  await videos.reduce(async (lastPromise, video) => {
    await lastPromise;
    const details = await DB.collection(COLLECTION.PERFORMER).findOne({ _id: video.performerId });

    if (!details) {
      const oldVideoParticipants = await DB.collection(COLLECTION.PERFORMER_VIDEO).find(
        { participantIds: video.performerId.toString() }
      ).toArray();

      oldVideoParticipants && oldVideoParticipants.length > 0
      && oldVideoParticipants.map(async (oldVideoParticipant) => {
        await DB.collection(COLLECTION.PERFORMER_VIDEO).updateOne(
          { _id: oldVideoParticipant._id },
          {
            $pull: {
              participantIds: video.performerId.toString()
            }
          }
        );
      });

      await DB.collection(COLLECTION.PERFORMER_VIDEO).deleteMany({ performerId: video.performerId });
    }
  }, Promise.resolve());

  // delete old photo
  const photos = await DB.collection(COLLECTION.PERFORMER_PHOTO).find({}).toArray();
  if (!photos.length) return;

  await photos.reduce(async (lastPromise, photo) => {
    await lastPromise;
    const details = await DB.collection(COLLECTION.PERFORMER).findOne({ _id: photo.performerId });

    if (!details) {
      await
      DB.collection(COLLECTION.PERFORMER_PHOTO).deleteMany({ performerId: photo.performerId });
    }
  }, Promise.resolve());

  // delete old gallery
  const galleries = await DB.collection(COLLECTION.PERFORMER_GALLERY).find({}).toArray();
  if (!galleries.length) return;

  await galleries.reduce(async (lastPromise, gallery) => {
    await lastPromise;
    const details = await DB.collection(COLLECTION.PERFORMER).findOne({ _id: gallery.performerId });

    if (!details) {
      await
      DB.collection(COLLECTION.PERFORMER_GALLERY).deleteMany({ performerId: gallery.performerId });
    }
  }, Promise.resolve());

  // delete old product
  const products = await DB.collection(COLLECTION.PERFORMER_PRODUCT).find({}).toArray();
  if (!products.length) return;

  await products.reduce(async (lastPromise, product) => {
    await lastPromise;
    const details = await DB.collection(COLLECTION.PERFORMER).findOne({ _id: product.performerId });

    if (!details) {
      await
      DB.collection(COLLECTION.PERFORMER_PRODUCT).deleteMany({ performerId: product.performerId });
    }
  }, Promise.resolve());
};
