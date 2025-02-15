// @flow

import _ from 'underscore';

const SORT_DESCENDING = 'descending';

/**
 * Mocks returning the data from an API call for a collection of records.
 *
 * @param items
 * @param page
 * @param search
 * @param sort_by
 * @param sort_direction
 * @param perPage
 *
 * @returns {Promise<unknown>}
 */
const onLoad = ({ items, page, per_page = 10, search, sort_by, sort_direction }) => {
  let payload = [...items];

  // Apply search filter
  if (search && search.length) {
    payload = _.filter(payload, (item) => {
      let match = false;

      _.each(_.keys(item), (key) => {
        if (item[key] && item[key].toString().toLowerCase().startsWith(search.toLowerCase())) {
          match = true;
        }
      });

      return match;
    });
  }

  // Apply sort
  if (sort_by && sort_by.length) {
    payload = _.sortBy(payload, (item) => item[sort_by]);

    if (sort_direction && sort_direction === SORT_DESCENDING) {
      payload = payload.reverse();
    }
  }

  // Apply pagination
  let pages = 0;

  if (page && per_page) {
    pages = Math.floor((payload.length / per_page) || 1);

    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + (per_page - 1);

    payload = payload.slice(startIndex, endIndex);
  }

  const response = {
    data: {
      items: payload,
      list: {
        count: items.length,
        pages
      }
    }
  };

  return new Promise((resolve) => resolve(response));
};

/**
 *
 *
 * @returns {Promise<unknown>}
 */
const onLoadEmpty = () => {
  const response = { data: { items: [], list: { pages: 1 } } };
  return new Promise((resolve) => resolve(response));
};

/**
 * Mocks returning the data from an API call for a collection of hierarchical records.
 *
 * @param items
 * @param parentId
 * @param parentKey
 * @param search
 *
 * @returns {Promise<unknown>}
 */
const onNestedLoad = ({ items, parentId, parentKey, search }) => {
  let payload = [...items];

  if (parentId) {
    payload = _.filter(payload, (item) => item[parentKey] === parentId);
  } else if (search && search.length) {
    payload = _.filter(payload, (item) => {
      let match = false;

      _.each(_.keys(item), (key) => {
        if (item[key] && item[key].toString().toLowerCase().startsWith(search.toLowerCase())) {
          match = true;
        }
      });

      return match;
    });
  } else {
    payload = _.where(payload, { [parentKey]: null });
  }

  const response = {
    data: {
      items: payload,
      list: {
        count: payload.length,
        pages: 1
      }
    }
  };

  return new Promise((resolve) => resolve(response));
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  onLoad,
  onLoadEmpty,
  onNestedLoad,
  sleep
};
