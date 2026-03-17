const crypto = require('crypto');

const mongoose = require('mongoose');

exports.COLLECTION = {
  SETTING: 'settings',
  USER: 'users',
  AUTH: 'auth',
  POST: 'posts',
  MENU: 'menus',
  PERFORMER: 'performers',
  EMAIL_TEMPLATE: 'emailtemplates',
  EARNING: 'earnings',
  REFERRAL_EARNING: 'referralEarnings',
  GROUP_EARNING: 'groupearnings',
  PURCHASED_ITEMS: 'purchaseditems',
  PAYOUT_REQUESTS: 'payoutrequests',
  PERFORMER_PRODUCT: 'performerproducts',
  PERFORMER_PHOTO: 'performerphotos',
  PERFORMER_VIDEO: 'performervideos',
  PERFORMER_GALLERY: 'performergalleries',
  PERFORMER_BANKING: 'performerbankingsetting',
  ORDER: 'orders',
  FEEDS: 'feeds',
  PROFILE: 'profile'
};

exports.DB = mongoose.connection;

exports.encryptPassword = (pw, salt) => {
  const defaultIterations = 10000;
  const defaultKeyLength = 64;

  return crypto
    .pbkdf2Sync(pw, salt, defaultIterations, defaultKeyLength, 'sha1')
    .toString('base64');
};

exports.generateSalt = (byteSize = 16) => crypto.randomBytes(byteSize).toString('base64');
