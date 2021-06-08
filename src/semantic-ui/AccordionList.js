// @flow

import React, { Component } from 'react';
import {
  Button,
  Confirm,
  Grid,
  Header,
  Input,
  Message,
  Pagination
} from 'semantic-ui-react';
import _ from 'underscore';
import i18n from '../i18n/i18n';
import EditModal from './EditModal';
import NestedAccordion from './NestedAccordion';
import Toaster from './Toaster';
import Timer from '../utils/Timer';
import './AccordionList.css';

type Props = {
  canAddItem?: (item: any) => boolean,
  canDeleteItem?: (item: any) => boolean,
  canEditItem?: (item: any) => boolean,
  className?: string,
  collectionName: string,
  getChildItems: (items: Array<any>, item: any) => Array<any>,
  getRootItems: (items: Array<any>) => Array<any>,
  modal?: {
    component: Component<{}>,
    onAddItem: (item: any) => any,
    props: any,
    state: any,
  },
  onDelete: (item: any) => Promise<any>,
  onSave: (item: any) => Promise<any>,
  onSearch: (parentId: ?number, search: ?string) => Promise<any>,
  pagination: (item: any) => boolean,
  renderItem: (item: any) => string | Component<{}>,
  showToggle: (item: any) => boolean
};

type State = {
  items: Array<any>,
  modalAdd: boolean,
  modalDelete: boolean,
  page: ?number,
  pages: ?number,
  saved: boolean,
  searchQuery: string,
  selectedItem: ?any
};

class AccordionList extends Component<Props, State> {
  static defaultProps: any;

  /**
   * Constructs a new AccordionList component.
   *
   * @param props
   */
  constructor(props: Props) {
    super(props);

    this.state = {
      items: [],
      modalAdd: false,
      modalDelete: false,
      page: 1,
      pages: 1,
      saved: false,
      searchQuery: '',
      selectedItem: null
    };
  }

  /**
   * Executes the initial search.
   */
  componentDidMount() {
    this.onSearch();
  }

  /**
   * Displays the add modal for the selected item.
   *
   * @param item
   */
  onAddButton(item: any) {
    let selectedItem = item;
    if (this.props.modal && this.props.modal.onAddItem) {
      selectedItem = this.props.modal.onAddItem(item);
    }

    this.setState({ modalAdd: true, selectedItem });
  }

  /**
   * Deletes the currently selected item.
   *
   * @returns {*}
   */
  onDelete() {
    const item = this.state.selectedItem;

    return this.props
      .onDelete(item)
      .then(() => {
        this.setState((state) => ({
          modalDelete: false,
          selectedItem: null,
          items: _.reject(state.items, (i) => i === item)
        }));
      });
  }

  /**
   * Displays the delete modal and sets the selected item.
   *
   * @param item
   */
  onDeleteButton(item: any) {
    this.setState({ modalDelete: true, selectedItem: item });
  }

  /**
   * Displays the edit modal and sets the selected item.
   *
   * @param item
   */
  onEditButton(item: any) {
    this.setState({ modalAdd: true, selectedItem: item });
  }

  /**
   * Lazy-loads the children of the passed item and sets them on the state..
   *
   * @param item
   */
  onItemToggle(item: any) {
    if (!item.loaded) {
      this.onSearch(item.id).then(() => {
        // Set the "loaded" property on item to prevent multiple API calls
        this.setState((state) => ({
          items: _.map(state.items, (i) => (i.id === item.id ? { ...i, loaded: true } : i))
        }));
      });
    }
  }

  /**
  * Changes active page and fetches new set of paginated data.
  */
  onPageChange(e: any, selectedPage: any) {
    this.setState({ page: selectedPage.activePage }, () => this.onSearch());
  }

  /**
   * Saves the passed item.
   *
   * @param item
   *
   * @returns {*}
   */
  onSave(item: any) {
    return this.props
      .onSave(item)
      .then((saved) => {
        this.setState((state) => ({
          modalAdd: false,
          selectedItem: false,
          saved: true,
          items: item.id ? _.map(state.items, (i) => (i.id === saved.id ? saved : i)) : [...state.items, saved]
        }));
      });
  }

  /**
   * Executes the search and sets the returned items on the state.
   *
   * @param parentId
   *
   * @returns {*}
   */
  onSearch(parentId?: number) {
    if (parentId) {
      return this.props
        .onSearch(parentId, this.state.searchQuery, this.state.page)
        .then(({ data }) => {
          const items = data[this.props.collectionName];
          this.setState((state) => (parentId
            ? { items: [...state.items || [], ...items] }
            : { items }));
            if (this.props.pagination) {
              const pageCount = data.list.pages;
              this.setState({ pages: pageCount });
            }
      });
    } else {
      // for models that use a join table or a relationship
      // structure other than nestable node levels/ancestors
        return this.props
          .onSearch(this.state.searchQuery, this.state.page)
          .then(({ data }) => {
            const items = data[this.props.collectionName];
            this.setState({ items: items });
            if (this.props.pagination) {
              const pageCount = data.list.pages;
              this.setState({ pages: pageCount });
            }
          });
    }
  }

  /**
   * Sets the search query on the state.
   *
   * @param e
   * @param value
   */
  onSearchChange(e: Event, { value }: any) {
    this.setState({ searchQuery: value });
  }

  /**
   * Renders the AccordionList component.
   *
   * @returns {*}
   */
  render() {
    return (
      <div
        className={['accordion-list', this.props.className || ''].join(' ')}
      >
        <Header
          className='accordion-header'
        >
          <Input
            autoFocus
            className='search'
            icon='search'
            onKeyDown={Timer.clearSearchTimer.bind(this)}
            onKeyUp={Timer.setSearchTimer.bind(this, this.onSearch.bind(this))}
            onChange={this.onSearchChange.bind(this)}
            size='mini'
            type='text'
            value={this.state.searchQuery}
          />
          { this.renderHeaderAddButton() }
        </Header>
        <NestedAccordion
          getChildItems={this.props.getChildItems.bind(this, this.state.items)}
          onItemToggle={this.onItemToggle.bind(this)}
          renderItem={this.props.renderItem.bind(this)}
          renderRight={this.renderRight.bind(this)}
          rootItems={this.props.getRootItems(this.state.items)}
          showToggle={this.props.showToggle.bind(this)}
        />
        { this.renderPagination() }
        { this.renderAddModal() }
        <Confirm
          content={i18n.t('AccordionList.deleteContent')}
          header={i18n.t('AccordionList.deleteHeader')}
          open={this.state.modalDelete}
          onCancel={() => this.setState({ modalDelete: false, selectedItem: null })}
          onConfirm={this.onDelete.bind(this)}
        />
        { this.state.saved && (
          <Toaster
            onDismiss={() => this.setState({ saved: false })}
            type={Toaster.MessageTypes.positive}
          >
            <Message.Header
              content={i18n.t('Common.messages.save.header')}
            />
            <Message.Content
              content={i18n.t('Common.messages.save.content')}
            />
          </Toaster>
        )}
      </div>
    );
  }

  /**
   * Renders the add button for the passed item (if applicable).
   *
   * @param item
   *
   * @returns {null|*}
   */
  renderAddButton(item: any) {
    if (this.props.canAddItem && !this.props.canAddItem(item)) {
      return null;
    }

    return (
      <Button
        basic
        compant
        icon='plus'
        onClick={this.onAddButton.bind(this, item)}
      />
    );
  }

  /**
   * Renders the add modal.
   *
   * @returns {null|*}
   */
  renderAddModal() {
    if (!(this.state.modalAdd && this.props.modal)) {
      return null;
    }

    const { component, props } = this.props.modal;

    return (
      <EditModal
        component={component}
        item={this.state.selectedItem}
        onClose={() => this.setState({ modalAdd: false, selectedItem: null })}
        onSave={this.onSave.bind(this)}
        {...props}
      />
    );
  }

  /**
   * Renders the delete button for the passed item (if applicable).
   *
   * @param item
   *
   * @returns {null|*}
   */
  renderDeleteButton(item: any) {
    if (this.props.canDeleteItem && !this.props.canDeleteItem(item)) {
      return null;
    }

    return (
      <Button
        basic
        compact
        icon='trash'
        onClick={this.onDeleteButton.bind(this, item)}
      />
    );
  }

  /**
   * Renders the edit button for the passed item (if applicable).
   *
   * @param item
   *
   * @returns {null|*}
   */
  renderEditButton(item: any) {
    if (this.props.canEditItem && !this.props.canEditItem(item)) {
      return null;
    }

    return (
      <Button
        basic
        compact
        icon='edit'
        onClick={this.onEditButton.bind(this, item)}
      />
    );
  }

  /**
   * Renders the header add button.
   *
   * @returns {null|*}
   */
  renderHeaderAddButton() {
    if (!this.props.modal) {
      return null;
    }

    return (
      <Button
        basic
        className='add-button'
        content={i18n.t('Common.buttons.add')}
        icon='plus'
        onClick={() => this.setState({ modalAdd: true })}
      />
    );
  }

  /**
   * Renders the pagination button row.
   *
   * @returns {null|*}
   */
  renderPagination() {
    if (!this.props.pagination) {
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
          </Grid.Column>
          <Grid.Column
            textAlign='right'
          >
            <Pagination
              activePage={this.state.page}
              onPageChange={this.onPageChange.bind(this)}
              size='mini'
              totalPages={this.state.pages}
            />
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  /**
   * Renders the right side of the passed item.
   *
   * @param item
   *
   * @returns {*}
   */
  renderRight(item: any) {
    return (
      <Button.Group>
        { this.renderAddButton(item) }
        { this.renderEditButton(item) }
        { this.renderDeleteButton(item) }
      </Button.Group>
    );
  }
}

AccordionList.defaultProps = {
  canAddItem: () => true,
  canDeleteItem: () => true,
  canEditItem: () => true,
  className: '',
  modal: undefined
};

export default AccordionList;
