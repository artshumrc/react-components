// @flow

import React, { useEffect, useState } from 'react';
import { withA11y } from '@storybook/addon-a11y';
import { withKnobs } from '@storybook/addon-knobs';
import { Card } from 'semantic-ui-react';
import _ from 'underscore';
import Cars from '../../data/Cars.json';
import InfiniteScroll from '../../../src/common/InfiniteScroll';
import useDragDrop from '../../../src/utils/DragDrop';

export default {
  title: 'Components/Common/InfiniteScroll',
  decorators: [withA11y, withKnobs]
};

const PER_PAGE = 10;

export const Default = useDragDrop(() => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const startIndex = (page - 1) * PER_PAGE;
    const endIndex = startIndex + PER_PAGE;

    setItems((prevItems) => [
      ...prevItems,
      ...Cars.slice(startIndex, endIndex)
    ]);
  }, [page]);

  return (
    <InfiniteScroll
      offset={100}
      onBottomReached={() => setPage((prevPage) => prevPage + 1)}
    >
      <Card.Group>
        { _.map(items, (item) => (
          <Card
            header={item.make}
            meta={item.model}
            description={item.address}
          />
        ))}
      </Card.Group>
    </InfiniteScroll>
  );
});
