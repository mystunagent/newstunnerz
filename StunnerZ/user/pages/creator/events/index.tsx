import Page from '@components/common/layout/page';
import EventListTable from '@components/events/event-list';
import FilterEventForm from '@components/events/filter-event';
import { IPerformer } from '@interfaces/index';
import { eventService } from '@services/events.service';
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';

interface IProps {
  user: IPerformer,
}
function EventList({ user }: IProps) {
  const [dataEvent, setDataEvent] = useState<Record<string, any>>();
  const [pagination, setPagination] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [sort, setSort] = useState<string>('desc');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const limit = 10;

  const loadDataEvent = async (page = 1) => {
    try {
      setLoading(true);
      const { data } = await eventService.search({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      setDataEvent(data?.data);
      setLoading(false);
      setPagination({
        ...pagination,
        total: data?.total,
        pageSize: limit
      });
    } catch (error) {
      setLoading(false);
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  };

  const handleTableChange = async (pag, filters, sorter) => {
    const pager = { ...pagination };
    pager.current = pag.current;
    setPagination(pager);
    setSortBy(sorter.field || 'updatedAt');
    // eslint-disable-next-line no-nested-ternary
    setSort(sorter.order
      ? sorter.order === 'descend'
        ? 'desc'
        : 'asc'
      : 'desc');
    await loadDataEvent(pager.current);
  };

  const handleFilter = async (values) => {
    await setFilter({ ...filter, ...values });
  };

  useEffect(() => {
    if(user?.infoSubPerformer?._id && !user?.infoBankSubPerformer){
      Router.push('/');
      return;
    }
    if (user?.infoSubPerformer?._id && (!user?.infoSubPerformer?.privilege.includes('all') && !user?.infoSubPerformer?.privilege.includes('events'))) {
      Router.push('/');
      return;
    }
  }, []);

  useEffect(() => {
    loadDataEvent();
  }, [filter]);

  return (
    <>
      <Head>
        <title>Event List</title>
      </Head>
      <Page className="main-container">
        <FilterEventForm handleFilter={handleFilter} />
        <div className="table-responsive">
          <EventListTable
            dataSource={dataEvent}
            rowKey="_id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            user={user}
          />
        </div>
      </Page>
    </>
  );
}

EventList.authenticate = true;
EventList.onlyPerformer = true;
const mapStates = (state: any) => ({
  user: state.user.current
});

export default connect(mapStates)(EventList);
