/* eslint-disable no-nested-ternary */
import Head from 'next/head';
import { PureComponent } from 'react';
import {
  message, Statistic, Row, Col
} from 'antd';
import Page from '@components/common/layout/page';
import { earningService } from '@services/earning.service';
import { SearchFilter } from '@components/common/search-filter';
import TableListEarning from '@components/earning/table-list-earning';
import { BreadcrumbComponent } from '@components/common';

interface IEarningStatResponse {
  totalSiteCommission: number;
  totalGrossPrice: number;
  totalNetPrice: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  totalSubAmount: number;
}

interface IProps {
  sourceId: string;
  stats: IEarningStatResponse;
}

class Earning extends PureComponent<IProps> {
  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: false,
    list: [] as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'updateAt',
    sort: 'desc',
    stats: {
      totalGrossPrice: 0,
      totalSiteCommission: 0,
      totalNetPrice: 0,
      totalPaidAmount: 0,
      totalUnpaidAmount: 0
    } as IEarningStatResponse,
    performerId: ''
  };

  async componentDidMount() {
    this.search();
    this.stats();
  }

  handleUpdateSuccess = () => {
    this.search();
    this.stats();
  }

  handleTableChange = async (pagi, filters, sorter) => {
    const { pagination } = this.state;
    const pager = { ...pagination, ...pagi };
    // pager.current = pagi.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updateAt',
      sort: sorter.order ? (sorter.order === 'descend' ? 'desc' : 'asc') : 'desc'
    });
    this.search(pager.current, pagi?.pageSize);
  };

  async handleFilter(values) {
    const { filter } = this.state;
    if (values?.performerId === 'all') {
      await this.setState({ filter: { ...filter, ...values, performerId: '', limit: 0 } });
      this.stats();
      this.searchAll();
    } else {
      await this.setState({ filter: { ...filter, ...values }, performerId: values?.performerId || '' });
      this.search();
      this.stats();
    }
  }

  async search(page = 1, size?: number) {
    const {
      filter, limit, sort, sortBy, pagination
    } = this.state;
    const pageSize = size ? size : limit;
    try {
      this.setState({ searching: true });
      const resp = await earningService.search({
        ...filter,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort,
        sortBy
      });
      this.setState({
        searching: false,
        list: resp.data.data.map((item) => {
          const obj = item;
          obj.siteEarning = (item.grossPrice - item.netPrice);
          return obj;
        }),
        pagination: {
          ...pagination,
          total: resp.data.total
        }
      });
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  async searchAll(page = 1) {
    const {
      filter, sort, sortBy, pagination
    } = this.state;
    try {
      this.setState({ searching: true });
      const resp = await earningService.search({
        ...filter,
        offset: 0,
        sort,
        sortBy
      });
      this.setState({
        searching: false,
        list: resp.data.data.map((item) => {
          const obj = item;
          obj.siteEarning = (item.grossPrice - item.netPrice);
          return obj;
        }),
        pagination: {
          ...pagination,
          total: resp.data.total,
          pageSize: resp.data.total
        }
      });
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  async stats() {
    const { filter } = this.state;
    try {
      const resp = await earningService.stats({
        ...filter
      });
      this.setState({
        stats: resp.data
      });
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'An error occurred, please try again!');
    }
  }

  render() {
    const {
      list, searching, pagination, stats, performerId, filter
    } = this.state;
    const type = [
      {
        key: '',
        text: 'All Types'
      },
      { key: 'tip', text: 'Tip' },
      { key: 'feed', text: 'Post' },
      { key: 'message', text: 'Message' },
      { key: 'video', text: 'Video' },
      { key: 'gallery', text: 'Gallery' },
      { key: 'product', text: 'Product' },
      { key: 'stream_tip', text: 'Streaming tip' },
      { key: 'public_chat', text: 'Paid steaming' },
      {
        key: 'trial_subscription',
        text: 'Trial Subscription'
      },
      {
        key: 'monthly_subscription',
        text: 'Monthly Subscription'
      },
      {
        key: 'six_month_subscription',
        text: 'Six Months Subscription'
      },
      {
        key: 'one_time_subscription',
        text: 'One Time Subscription'
      },
      { key: 'referral', text: 'Referral' }
    ];

    return (
      <>
        <Head>
          <title>Earnings Report</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Earnings Report' }]} />
        <Page>
          <Row gutter={16} style={{ marginBottom: '10px' }}>
            <Col span={8}>
              <Statistic title="Total Earnings" prefix="$" value={stats?.totalGrossPrice?.toFixed(2) || 0} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Admin Earned" prefix="$" value={stats?.totalSiteCommission?.toFixed(2) || 0} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Models Earnings" prefix="$" value={stats?.totalNetPrice?.toFixed(2) || 0} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Total Paid" prefix="$" value={stats?.totalPaidAmount?.toFixed(2) || 0} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Total Unpaid" prefix="$" value={stats?.totalUnpaidAmount?.toFixed(2) || 0} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Total Agency Earned" prefix="$" value={stats?.totalSubAmount?.toFixed(2) || 0} precision={2} />
            </Col>
          </Row>
          <SearchFilter
            type={type}
            onSubmit={this.handleFilter.bind(this)}
            searchWithPerformerPayment
            searchPayoutStatus
            searchLatestPayment
            searchWithSubPerformer
            dateRange
          />
          <div style={{ marginBottom: '20px' }} />
          <div className="table-responsive">
            <TableListEarning
              performerId={performerId}
              filter={filter}
              handleUpdateSuccess={this.handleUpdateSuccess.bind(this)}
              dataSource={list}
              rowKey="_id"
              loading={searching}
              pagination={pagination}
              onChange={this.handleTableChange.bind(this)}
            />
          </div>
        </Page>
      </>
    );
  }
}

export default Earning;
