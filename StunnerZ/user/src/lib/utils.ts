import { SORT } from '@services/api-request';
import {
  cloneDeep
} from 'lodash';
import * as pathToRegexp from 'path-to-regexp';

/**
 * Convert an array to a tree-structured array.
 * @param   {array}     array     The Array need to Converted.
 * @param   {string}    id        The alias of the unique ID of the object in the array.
 * @param   {string}    parentId       The alias of the parent ID of the object in the array.
 * @param   {string}    children  The alias of children of the object in the array.
 * @return  {array}    Return a tree-structured array.
 */
export function arrayToTree(
  array,
  id = 'id',
  parentId = 'pid',
  children = 'children'
) {
  const result = [];
  const hash = {};
  const data = cloneDeep(array);

  data.forEach((item, index) => {
    hash[data[index][id]] = data[index];
  });

  data.forEach((item) => {
    const hashParent = hash[item[parentId]];
    if (hashParent) {
      !hashParent[children] && (hashParent[children] = []);
      hashParent[children].push(item);
    } else {
      result.push(item);
    }
  });
  return result;
}

/**
 * Whether the path matches the regexp if the language prefix is ignored, https://github.com/pillarjs/path-to-regexp.
 * @param   {string|regexp|array}     regexp     Specify a string, array of strings, or a regular expression.
 * @param   {string}                  pathname   Specify the pathname to match.
 * @return  {array|null}              Return the result of the match or null.
 */
export function pathMatchRegexp(regexp, pathname) {
  return pathToRegexp.pathToRegexp(regexp).exec(pathname);
}

/**
 * In an array of objects, specify an object that traverses the objects whose parent ID matches.
 * @param   {array}     array     The Array need to Converted.
 * @param   {string}    current   Specify the object that needs to be queried.
 * @param   {string}    parentId  The alias of the parent ID of the object in the array.
 * @param   {string}    id        The alias of the unique ID of the object in the array.
 * @return  {array}    Return a key array.
 */
export function queryAncestors(array, current, parentId, id = 'id') {
  const result = [current];
  const hashMap = new Map();
  array.forEach((item) => hashMap.set(item[id], item));

  const getPath = (pr) => {
    const currentParentId = hashMap.get(pr[id])[parentId];
    if (currentParentId) {
      result.push(hashMap.get(currentParentId));
      getPath(hashMap.get(currentParentId));
    }
  };

  getPath(current);
  return result;
}

export function getResponseError(data: any) {
  if (!data) {
    return '';
  }

  if (Array.isArray(data.message)) {
    const item = data.message[0];
    if (!item.constraints) {
      return data.error || 'Bad request!';
    }
    return Object.values(item.constraints)[0];
  }

  // TODO - parse for langauge or others
  return typeof data.message === 'string' ? data.message : 'Bad request!';
}

export function getSearchData(pagination, filters, sorter, state) {
  let { sort, sortBy, filter } = state;
  const { limit } = state;
  if (filters) {
    Object.keys(filters).forEach((key) => {
      if (filters[key] && filters[key].length) {
        // eslint-disable-next-line prefer-destructuring
        filter[key] = filters[key][0];
      }

      if (!filters[key]) {
        filter[key] = '';
      }
    });
  } else {
    filter = {};
  }

  if (sorter) {
    if (sorter.order) {
      const { field, order } = sorter;
      sort = SORT[order];
      sortBy = field;
    } else {
      sortBy = 'createdAt';
      sort = 'desc';
    }
  }

  return {
    ...state,
    ...filter,
    sort,
    sortBy,
    offset: (pagination.current - 1) * limit
  };
}

export const isObjectId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

export const PERFORMER_PRIVILEGES = {
  ALL: 'all',
  SUB_ACCOUNT: 'sub_account',
  // DIRECT_MESSAGE: 'direct_message',
  SUBSCRIPTION_LIST: 'subscription_list',
  SUBSCRIPTION: 'subscription',
  // VIOLATION: 'violation',
  // PAYOUT_REQUEST: 'payout_request',
  EDIT_PROFILE: 'edit_profile',
  TIP: 'tip',
  STREAM: 'streaming',
  BLACK_LIST: 'black_list',
  BLOCK_COUNTRIES: 'block_countries',
  REFERRAL: 'referral',
  POSTING: 'posting',
  MESSAGES: 'messages',
  WELCOME_MESSAGE: 'welcome_message',
  MY_FEED: 'my_feed',
  AVAILABLE_TIME: 'available_time',
  BOOKING_STREAM: 'booking_stream',
  VIDEOS: 'videos',
  EVENTS: 'events',
  PRODUCTS: 'products',
  GALLERY: 'gallery',
  ORDER: 'order',
  EARNING: 'earning'
};

export function redirectTo(toPath: string, ctx = null) {
  if (typeof window !== 'undefined') {
    window.location.href = '/404';
    return {};
  }

  if (!ctx) return {};

  ctx.res.writeHead && ctx.res.writeHead(302, { Location: toPath });
  ctx.res.end && ctx.res.end();
  // getInitialProps should not return undefined
  return {};
}

export function redirect404(ctx = null) {
  return redirectTo('/404', ctx);
}
