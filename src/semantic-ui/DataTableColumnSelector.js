// @flow

import React, { Component, type ComponentType } from 'react';
import { Checkbox, Dropdown, Icon } from 'semantic-ui-react';
import _ from 'underscore';
import Draggable from './Draggable';

import type { Column } from './DataTable';

type Props = {
  columns: Array<Column>
};

type State = {
  columns: Array<Column>
};

const useColumnSelector = (WrappedComponent: ComponentType<any>) => (
  class extends Component<Props, State> {
    constructor(props: Props) {
      super(props);

      this.state = {
        columns: props.columns
      };
    }

    /**
     * Toggles the hidden property for the passed column.
     *
     * @param column
     */
    onColumnCheckbox(column: Column) {
      this.setState((state) => ({
        columns: _.map(state.columns, (c) => (c.name === column.name ? { ...c, hidden: !c.hidden } : c))
      }));
    }

    /**
     * Drags/drops the column at the passed index to the new position.
     *
     * @param dragIndex
     * @param hoverIndex
     */
    onDrag(dragIndex: number, hoverIndex: number) {
      this.setState((state) => {
        const columns = [];
        const anchoredColumns = [];

        // Preserve the index of any unlabeled columns
        _.each(state.columns, (column, index) => {
          if (column.label && column.label.length) {
            columns.push(column);
          } else {
            anchoredColumns.push({ index, column });
          }
        });

        const column = columns[dragIndex];
        columns.splice(dragIndex, 1);
        columns.splice(hoverIndex, 0, column);

        // Add the unlabeled columns back in
        _.each(anchoredColumns, (c) => columns.splice(c.index, 0, c.column));

        return { columns };
      });
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          columns={this.state.columns}
          renderListHeader={this.renderHeader.bind(this)}
        />
      );
    }

    renderHeader() {
      return (
        <Dropdown
          basic
          button
          icon='cog'
          className='icon configure-button open-right'
          simple
        >
          <Dropdown.Menu>
            { this.state.columns
              .filter((c) => c.label && c.label.length)
              .map((c, index) => (
                <Draggable
                  id={c.name}
                  index={index}
                  key={c.name}
                  onDrag={this.onDrag.bind(this)}
                >
                  <Dropdown.Item>
                    <Icon
                      name='bars'
                    />
                    <Checkbox
                      checked={!c.hidden}
                      label={c.label}
                      onClick={this.onColumnCheckbox.bind(this, c)}
                    />
                  </Dropdown.Item>
                </Draggable>
              ))}
          </Dropdown.Menu>
        </Dropdown>
      );
    }
  }
);

export default useColumnSelector;