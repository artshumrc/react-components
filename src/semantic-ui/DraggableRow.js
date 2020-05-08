// @flow

import React, { Component, useRef } from 'react';
import { Ref, Table } from 'semantic-ui-react';
import { useDrag, useDrop } from 'react-dnd';

type Props = {
  children: Component,
  id: number,
  index: number,
  onDrag: (dragIndex: number, hoverIndex: number) => void
};

const TYPE_ROW = 'row';

const DraggableRow = (props: Props) => {
  const { index, id } = props;

  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: TYPE_ROW,
    hover(i, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = i.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      props.onDrag(dragIndex, hoverIndex);

      // // Note: we're mutating the monitor item here!
      // // Generally it's better to avoid mutations,
      // // but it's good here for the sake of performance
      // // to avoid expensive index searches.
      // eslint-disable-next-line no-param-reassign
      i.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    item: { type: TYPE_ROW, id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <Ref
      innerRef={ref}
    >
      <Table.Row
        style={{ opacity: isDragging ? 0 : 1 }}
      >
        { props.children }
      </Table.Row>
    </Ref>
  );
};

export default DraggableRow;
