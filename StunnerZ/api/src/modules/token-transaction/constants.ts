/* eslint-disable no-shadow */
export const PURCHASE_ITEM_TYPE = {
  VIDEO: 'video',
  PRODUCT: 'product',
  GALLERY: 'gallery',
  TIP: 'tip',
  FEED: 'feed',
  MESSAGE: 'message',
  PUBLIC_CHAT: 'public_chat',
  GROUP_CHAT: 'group_chat',
  PRIVATE_CHAT: 'private_chat',
  GIFT: 'gift',
  INVITATION_REGISTER: 'invitation_register',
  STREAM_TIP: 'stream_tip',
  BOOKING_STREAM: 'booking-stream',
  EVENT: 'event'
};

export enum PurchaseItemType {
  VIDEO = 'video',
  PRODUCT = 'product',
  GALLERY = 'gallery',
  TIP = 'tip',
  FEED = 'feed',
  MESSAGE = 'message',
  GIFT = 'gift',
  PUBLIC_CHAT = 'public_chat',
  GROUP_CHAT = 'group_chat',
  PRIVATE_CHAT = 'private_chat',
  STREAM_TIP = 'stream_tip'
}

export const PURCHASE_ITEM_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  REFUNDED: 'refunded'
};

export const PURCHASE_ITEM_TARTGET_TYPE = {
  PRODUCT: 'product',
  VIDEO: 'video',
  GALLERY: 'gallery',
  FEED: 'feed',
  MESSAGE: 'message',
  PERFORMER: 'performer',
  STREAM: 'stream',
  PRIVATE_STREAM: 'private_stream',
  BOOKING_STREAM: 'booking-stream',
  EVENT: 'event'
};

export const ORDER_TOKEN_STATUS = {
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  REFUNDED: 'refunded'
};

export enum PURCHASE_ITEM_TARGET_SOURCE {
  USER = 'user'
}

export const TOKEN_TRANSACTION_SUCCESS_CHANNEL = 'TOKEN_TRANSACTION_SUCCESS_CHANNEL';
export const TOKEN_TRANSACTION_UPDATE_SUCCESS_CHANNEL = 'TOKEN_TRANSACTION_UPDATE_SUCCESS_CHANNEL';
export const TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL = 'TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL';
export const UPDATE_TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL = 'UPDATE_TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL';
export const APPROVE_BOOKING_PRIVATE_STREAM_CHANNEL = 'APPROVE_BOOKING_PRIVATE_STREAM_CHANNEL';

export const OVER_PRODUCT_STOCK = 'Not Enough Stock!';
