import Head from 'next/head';
import { PureComponent } from 'react';
import Page from '@components/common/layout/page';
import { BreadcrumbComponent } from '@components/common';
import { withRouter } from 'next/router';
import { EventListTable } from '@components/event/event-list';
import { message } from 'antd';
import { eventsService } from '@services/event.service';
import FilterEventForm from '@components/event/event-filter-form';

interface IProps {}

class EventList extends PureComponent<IProps> {
  state = {
    loading: false,
    dataEvent: [] as any,
    limit: 10,
    filter: {},
    sortBy: 'updatedAt',
    sort: 'desc',
    pagination: {} as any
  };

  async componentDidMount() {
    this.handleLoad();
  }

  async handleLoad(page = 1) {
    const {
      filter, limit, sort, sortBy, pagination
    } = this.state;
    try {
      this.setState({ loading: true });
      const { data } = await eventsService.search({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      this.setState({
        dataEvent: data?.data,
        loading: false,
        pagination: {
          ...pagination,
          total: data?.total,
          pageSize: limit
        }
      });
    } catch (error) {
      this.setState({ loading: false });
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  }

  handleTableChange = async (pag, filters, sorter) => {
    const { pagination } = this.state;
    const pager = { ...pagination };
    pager.current = pag.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updatedAt',
      // eslint-disable-next-line no-nested-ternary
      sort: sorter.order
        ? sorter.order === 'descend'
          ? 'desc'
          : 'asc'
        : 'desc'
    });
    this.handleLoad(pager.current);
  };

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.handleLoad();
  }

  async deleteEvent(id: string) {
    const { pagination } = this.state;
    if (!window.confirm('Are you sure to remove it?')) {
      return;
    }
    try {
      await eventsService.delete(id);
      message.success('Event deleted successfully');
      this.handleLoad(pagination.current);
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'An error occurred, please try again!');
    }
  }

  render() {
    const { loading, dataEvent, pagination } = this.state;
    return (
      <>
        <Head>
          <title>Event List</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Event List' }]} />
        <Page>
          <div className="table-responsive">
            <FilterEventForm handleFilter={this.handleFilter.bind(this)} />
            <EventListTable
              dataSource={dataEvent}
              rowKey="_id"
              loading={loading}
              pagination={pagination}
              deleteEvent={this.deleteEvent.bind(this)}
              onChange={this.handleTableChange.bind(this)}
            />
          </div>
        </Page>
      </>
    );
  }
}

export default withRouter(EventList as any);
