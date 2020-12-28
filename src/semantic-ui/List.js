// @flow

import React, { Component, type ComponentType, type Element } from 'react';
import { Trans } from 'react-i18next';
import {
  Button,
  Confirm,
  Grid,
  Header,
  Icon,
  Menu,
  Pagination,
  Popup,
} from 'semantic-ui-react';
import _ from 'underscore';
import i18n from '../i18n/i18n';
import EditModal from './EditModal';
import './List.css';

type Action = {
  accept: (item: any) => boolean,
  color?: string,
  icon?: string,
  name: string,
  onClick?: (item: any) => void,
  popup: {
    content: string,
    title: string
  },
  render?: (item: any, index: number) => Element<any>,
  title?: string
};

type ListButton = {
  render: (index?: number) => Element<any>
};

type Props = {
  actions: Array<Action>,
  addButton: {
    color: string,
    location: string,
    onClick?: () => void
  },
  buttons: Array<ListButton>,
  className: string,
  configurable: boolean,
  deleteButton?: {
    color: string,
    location: string,
    onClick?: () => void
  },
  filters?: {
    active: boolean,
    component: Component<{}>,
    props?: any,
    state?: any,
    onChange: (params: any) => Promise<any>
  },
  items: ?Array<any>,
  loading?: boolean,
  modal?: {
    component: Element<any>,
    props: any,
    state: any
  },
  page: number,
  pages: number,
  onCopy?: (item: any) => any,
  onDelete: (item: any) => void,
  onDeleteAll?: () => Promise<any>,
  onPageChange: () => void,
  onSave: (item: any) => Promise<any>,
  renderDeleteModal?: ({ selectedItem: any, onCancel: () => void, onConfirm: () => void }) => Element<any>,
  renderEmptyRow?: () => void,
  renderItem?: (item: any, index: number, children?: any) => Element<any>,
  renderListHeader?: () => Element<any>,
  renderSearch?: () => Element<any>,
  t: (key: string) => string
};

type State = {
  modalDelete: boolean,
  modalDeleteAll: boolean,
  modalEdit: boolean,
  modalFilter: boolean,
  selectedItem: any
};

const BUTTON_KEY_ADD = 'add';
const BUTTON_KEY_DELETE_ALL = 'delete-all';

const useList = (WrappedComponent: ComponentType<any>) => (
  class extends Component<Props, State> {
    static defaultProps = {
      actions: [],
      addButton: {
        location: 'top',
        color: 'green'
      },
      buttons: [],
      className: '',
      filters: undefined,
      items: [],
      loading: false,
      modal: undefined,
      page: 1,
      pages: 1,
      onColumnClick: () => {},
      onCopy: undefined,
      onPageChange: () => {},
      renderDeleteModal: undefined,
      renderEmptyRow: undefined,
      renderSearch: undefined,
      renderItem: undefined,
      sortColumn: undefined,
      sortDirection: undefined
    };

    /**
     * Constructs a new DataTable component.
     *
     * @param props
     */
    constructor(props: Props) {
      super(props);

      this.state = {
        modalDelete: false,
        modalDeleteAll: false,
        modalEdit: false,
        modalFilter: false,
        selectedItem: null
      };
    }

    /**
     * Renders the list of buttons for the passed location.
     *
     * @param location
     */
    getButtons(location: string) {
      const buttons = [];

      const { addButton = {}, deleteButton = {}, modal } = this.props;

      // Add the add button to the list if the location specified is the passed location.
      if (addButton.location === location && (addButton.onClick || modal)) {
        buttons.push({
          render: this.renderAddButton.bind(this)
        });
      }

      // Add the delete all button to the list if the location specified is the passed location.
      if (deleteButton.location === location && this.props.onDeleteAll) {
        buttons.push({
          render: this.renderDeleteAllButton.bind(this)
        });
      }

      // Resolve the array of other buttons
      buttons.push(..._.filter(this.props.buttons, (button) => {
        let include = false;

        /*
         * Include the button if the buttons specifies the passed location.
         * Include the button if no location is specified, but the add button is at the passed location.
         * Finally, include the button if the passed location is the top location.
         */
        if ((button.location || 'top') === location) {
          include = true;
        } else if (!button.location && addButton && addButton.location === location) {
          include = true;
        }

        return include;
      }));

      return buttons;
    }

    /**
     * Displays the add/edit modal.
     */
    onAddButton() {
      return this.props.addButton && this.props.addButton.onClick
        ? this.props.addButton.onClick()
        : this.setState({ modalEdit: true });
    }

    /**
     * Copies the selected item and displays the add/edit modal.
     *
     * @param selectedItem
     */
    onCopyButton(selectedItem: any) {
      const copy = this.props.onCopy
        ? this.props.onCopy(selectedItem)
        : _.omit(selectedItem, 'id', 'uid');

      this.setState({ selectedItem: copy, modalEdit: true });
    }

    /**
     * Deletes the currently selected item and clears the state.
     *
     * @returns {*}
     */
    onDelete() {
      const { selectedItem } = this.state;
      this.setState({ selectedItem: null, modalDelete: false });

      return this.props.onDelete(selectedItem);
    }

    /**
     * Deletes all items in the current list and resets the state.
     *
     * @returns {*}
     */
    onDeleteAll() {
      this.setState({ modalDeleteAll: false });
      return this.props.onDeleteAll && this.props.onDeleteAll();
    }

    /**
     * Displays the delete all confirmation modal.
     */
    onDeleteAllButton() {
      this.setState({ modalDeleteAll: true });
    }

    /**
     * Displays the delete confirmation modal for the selected item.
     *
     * @param selectedItem
     */
    onDeleteButton(selectedItem: any) {
      this.setState({ selectedItem, modalDelete: true });
    }

    /**
     * Displays the add/edit modal for the selected item.
     *
     * @param selectedItem
     */
    onEditButton(selectedItem: any) {
      this.setState({ selectedItem, modalEdit: true });
    }

    /**
     * Opens the filters modal.
     */
    onFilterButton() {
      this.setState({ modalFilter: true });
    }

    /**
     * Saves the passed item and closes the add/edit modal.
     *
     * @param item
     *
     * @returns {*}
     */
    onSave(item: any) {
      return this.props
        .onSave(item)
        .then(() => this.setState({ modalEdit: false, selectedItem: null }));
    }

    /**
     * Calls the filters onChange prop and closes the modal.
     *
     * @param filters
     *
     * @returns {Q.Promise<any> | Promise<R> | Promise<any> | void | *}
     */
    onSaveFilter(filters: any) {
      if (!this.props.filters) {
        return null;
      }

      return this.props.filters
        .onChange(filters)
        .then(() => this.setState({ modalFilter: false }));
    }

    /**
     * Renders the DataTable component.
     *
     * @returns {*}
     */
    render() {
      return (
        <div
          className={`data-table ${this.props.className}`}
        >
          { this.renderHeader() }
          <WrappedComponent
            {...this.props}
            actions={this.getActions()}
            renderEmptyMessage={this.renderEmptyMessage.bind(this)}
          />
          { this.renderFooter() }
          { this.renderEditModal() }
          { this.renderDeleteModal() }
          { this.renderDeleteAllModal() }
          { this.renderFilterModal() }
        </div>
      );
    }

    getActions() {
      return _.map(this.props.actions, (action) => {
        let defaults = {};

        if (action.name === 'edit') {
          defaults = {
            icon: 'edit outline',
            onClick: this.onEditButton.bind(this)
          };
        } else if (action.name === 'copy') {
          defaults = {
            icon: 'copy outline',
            onClick: this.onCopyButton.bind(this)
          };
        } else if (action.name === 'delete') {
          defaults = {
            icon: 'times circle outline',
            onClick: this.onDeleteButton.bind(this)
          };
        }

        return _.defaults(action, defaults);
      });
    }

    /**
     * Renders the action button for the passed item and action.
     *
     * @param item
     * @param action
     * @param index
     *
     * @returns {*}
     */
    renderActionButton(item: any, index: number, action: Action) {
      // If the action specified its own render function, return the result of the function call
      if (action.render) {
        return action.render(item, index);
      }

      const actionButton = (
        <Button
          basic
          compact
          color={action.color}
          icon={action.icon}
          key={`${action.name}-${index}`}
          onClick={action.onClick && action.onClick.bind(this, item)}
          title={action.title}
        />
      );

      // Wrap the button in a popup if the action specifies a popup attribute
      if (action.popup) {
        const { content, title } = action.popup;

        return (
          <Popup
            content={content}
            header={title}
            hideOnScroll
            mouseEnterDelay={500}
            position='top right'
            trigger={actionButton}
          />
        );
      }

      // Otherwise, simply return the button
      return actionButton;
    }

    // /**
    //  * Renders the actions for the passed item.
    //  *
    //  * @param item
    //  * @param index
    //  *
    //  * @returns {null|*}
    //  */
    // renderActions(item: any, index: number) {
    //   if (!(this.props.actions && this.props.actions.length)) {
    //     return null;
    //   }
    //
    //   const actions = this.props.actions
    //     .filter((action) => !action.accept || action.accept(item))
    //     .map((action) => {
    //       let defaults = {};
    //
    //       if (action.name === 'edit') {
    //         defaults = {
    //           icon: 'edit outline',
    //           onClick: this.onEditButton.bind(this),
    //           popup: {
    //             title: i18n.t('DataTable.actions.edit.title'),
    //             content: i18n.t('DataTable.actions.edit.content')
    //           }
    //         };
    //       } else if (action.name === 'copy') {
    //         defaults = {
    //           icon: 'copy outline',
    //           onClick: this.onCopyButton.bind(this),
    //           popup: {
    //             title: i18n.t('DataTable.actions.copy.title'),
    //             content: i18n.t('DataTable.actions.copy.content')
    //           }
    //         };
    //       } else if (action.name === 'delete') {
    //         defaults = {
    //           icon: 'times circle outline',
    //           onClick: this.onDeleteButton.bind(this),
    //           popup: {
    //             title: i18n.t('DataTable.actions.delete.title'),
    //             content: i18n.t('DataTable.actions.delete.content')
    //           }
    //         };
    //       }
    //
    //       return _.defaults(action, defaults);
    //     });
    //
    //   return (
    //     <Table.Cell
    //       className='actions-cell'
    //       key={index}
    //     >
    //       { actions.map(this.renderActionButton.bind(this, item, index)) }
    //     </Table.Cell>
    //   );
    // }

    /**
     * Renders the add button.
     *
     * @returns {*}
     */
    renderAddButton() {
      if (!this.props.addButton) {
        return null;
      }

      return (
        <Button
          basic
          color={this.props.addButton.color}
          key={BUTTON_KEY_ADD}
          onClick={this.onAddButton.bind(this)}
        >
          <Icon name='plus' />
          { i18n.t('DataTable.buttons.add') }
        </Button>
      );
    }

    /**
     * Renders the delete all button.
     *
     * @returns {null|*}
     */
    renderDeleteAllButton() {
      if (!this.props.deleteButton) {
        return null;
      }

      return (
        <Button
          basic
          color={this.props.deleteButton.color}
          key={BUTTON_KEY_DELETE_ALL}
          onClick={this.onDeleteAllButton.bind(this)}
        >
          <Icon name='times' />
          { i18n.t('DataTable.buttons.deleteAll') }
        </Button>
      );
    }

    /**
     * Renders the delete all modal if visible.
     *
     * @returns {null|*}
     */
    renderDeleteAllModal() {
      if (!this.state.modalDeleteAll) {
        return null;
      }

      return (
        <Confirm
          content={i18n.t('DataTable.deleteAllContent')}
          header={<Header icon='trash alternate outline' content={i18n.t('DataTable.deleteAllHeader')} />}
          onCancel={() => this.setState({ modalDeleteAll: false })}
          onConfirm={this.onDeleteAll.bind(this)}
          open
        />
      );
    }

    /**
     * Renders the delete modal if visible.
     *
     * @returns {null|*}
     */
    renderDeleteModal() {
      if (!this.state.modalDelete) {
        return null;
      }

      const { selectedItem } = this.state;
      const onCancel = () => this.setState({ selectedItem: null, modalDelete: false });
      const onConfirm = this.onDelete.bind(this);

      if (this.props.renderDeleteModal) {
        return this.props.renderDeleteModal({ selectedItem, onConfirm, onCancel });
      }

      return (
        <Confirm
          content={i18n.t('DataTable.deleteContent')}
          header={<Header icon='trash alternate outline' content={i18n.t('DataTable.deleteHeader')} />}
          onCancel={onCancel}
          onConfirm={onConfirm}
          open
        />
      );
    }

    /**
     * Renders the edit modal if visible.
     *
     * @returns {null|*}
     */
    renderEditModal() {
      if (!this.props.modal || !this.state.modalEdit) {
        return null;
      }

      const { component, props } = this.props.modal;

      return (
        <EditModal
          component={component}
          onClose={() => this.setState({ selectedItem: null, modalEdit: false })}
          onSave={this.onSave.bind(this)}
          item={this.state.selectedItem}
          {...props}
        />
      );
    }

    /**
     * Renders the empty message text/component. The message content is based on whether or not records can be added
     * to this data table.
     *
     * @returns {*}
     */
    renderEmptyMessage() {
      const { addButton = {}, modal } = this.props;
      if (!(addButton.onClick || modal)) {
        return i18n.t('DataTable.emptyList');
      }

      return (
        <Trans i18nKey='DataTable.emptyListAdd'>
          You haven&apos;t added any yet. Click
          <div className='empty-button'>
            { this.renderAddButton() }
          </div>
          to get started.
        </Trans>
      );
    }

    /**
     * Renders the filter button component.
     *
     * @returns {null|*}
     */
    renderFilterButton() {
      if (!(this.props.filters && this.props.filters.component)) {
        return null;
      }

      return (
        <Button
          active={this.props.filters.active}
          basic
          icon='filter'
          onClick={this.onFilterButton.bind(this)}
        />
      );
    }

    /**
     * Renders the filter modal if visible.
     *
     * @returns {null|*}
     */
    renderFilterModal() {
      if (!this.props.filters || !this.state.modalFilter) {
        return null;
      }

      const { component, props } = this.props.filters;

      return (
        <EditModal
          component={component}
          onClose={() => this.setState({ modalFilter: false })}
          onSave={this.onSaveFilter.bind(this)}
          {...props}
        />
      );
    }

    /**
     * Renders the table footer.
     *
     * @returns {null|*}
     */
    renderFooter() {
      let renderFooter = false;

      const buttons = this.getButtons('bottom');
      if (buttons && buttons.length) {
        renderFooter = true;
      }

      const hasPages = this.props.pages && this.props.pages > 1;
      if (hasPages) {
        renderFooter = true;
      }

      if (!renderFooter) {
        return null;
      }

      return (
        <div className='footer'>
          <Grid
            columns={2}
          >
            <Grid.Column
              textAlign='left'
            >
              { _.map(buttons, (button) => button.render()) }
            </Grid.Column>
            <Grid.Column
              textAlign='right'
            >
              { hasPages && this.renderPagination() }
            </Grid.Column>
          </Grid>
        </div>
      );
    }

    /**
     * Renders the table header.
     *
     * @returns {null|*}
     */
    renderHeader() {
      let renderHeader = false;

      const buttons = this.getButtons('top');
      if (buttons && buttons.length) {
        renderHeader = true;
      }

      const { filters, renderListHeader, renderSearch } = this.props;
      if (filters || renderListHeader || renderSearch) {
        renderHeader = true;
      }

      if (!renderHeader) {
        return null;
      }

      return (
        <div
          className='header'
        >
          <Grid
            columns={2}
            verticalAlign='bottom'
          >
            <Grid.Column
              textAlign='left'
            >
              { _.map(buttons, (button, index) => button.render(index)) }
            </Grid.Column>
            <Grid.Column
              textAlign='right'
            >
              <Menu
                compact
                borderless
                secondary
              >
                { renderListHeader && (
                  <Menu.Menu>
                    { renderListHeader() }
                  </Menu.Menu>
                )}
                <Menu.Menu>
                  { filters && this.renderFilterButton() }
                </Menu.Menu>
                <Menu.Menu>
                  { renderSearch && renderSearch() }
                </Menu.Menu>
              </Menu>
            </Grid.Column>
          </Grid>
        </div>
      );
    }

    /**
     * Renders the pagination component.
     *
     * @returns {null|*}
     */
    renderPagination() {
      return (
        <Pagination
          activePage={this.props.page}
          firstItem={null}
          lastItem={null}
          onPageChange={this.props.onPageChange.bind(this)}
          size='mini'
          totalPages={this.props.pages}
        />
      );
    }
  }
);

export default useList;

export type {
  Action,
  Props
};