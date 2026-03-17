import {
  Layout, message, Statistic
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import { DollarOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import {
  IPerformer, IUIConfig, IEarning, IPerformerStats
} from 'src/interfaces';
import { earningService } from 'src/services';
import { getResponseError } from '@lib/utils';
import TableListEarning from '@components/performer/table-earning';
import { SearchFilter } from 'src/components/common/search-filter';
import PageHeading from '@components/common/page-heading';
import './index.less';
import Router from 'next/router';

interface IProps {
  performer: IPerformer;
  ui: IUIConfig;
}
interface IStates {
  loading: boolean;
  earning: IEarning[];
  pagination: {
    total: number;
    current: number;
    pageSize: number;
  };
  stats: IPerformerStats;
  sortBy: string;
  sort: string;
  filter: any
}

const initialState = {
  loading: true,
  earning: [],
  pagination: { total: 0, current: 1, pageSize: 10 },
  stats: {
    totalGrossPrice: 0,
    totalSiteCommission: 0,
    totalNetPrice: 0,
    totalPaidAmount: 0,
    totalUnpaidAmount: 0
  },
  sortBy: 'createdAt',
  sort: 'desc',
  filter: {} as any
};

class EarningPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  constructor(props: IProps) {
    super(props);
    this.state = initialState;
  }

  componentDidMount() {
    const { performer } = this.props;
    if (performer.infoSubPerformer?._id) {
      Router.push('/');
      return;
    }
    this.getData();
    this.getPerformerStats();
  }

  async handleFilter(data) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...data } });
    this.getData();
    this.getPerformerStats();
  }

  async handleTabsChange(data) {
    const { pagination } = this.state;
    await this.setState({
      pagination: { ...pagination, current: data.current }
    });
    this.getData();
  }

  async getData() {
    const {
      filter, pagination, sort, sortBy
    } = this.state;
    try {
      const { current, pageSize } = pagination;
      const earning = await earningService.performerSearch({
        ...filter,
        limit: pageSize,
        offset: (current - 1) * pageSize,
        sort,
        sortBy
      });
      this.setState({
        earning: earning.data.data,
        pagination: { ...pagination, total: earning.data.total },
        loading: false
      });
    } catch (error) {
      message.error(getResponseError(await error));
      this.setState({ loading: false });
    }
  }

  async getPerformerStats() {
    const { filter } = this.state;
    const resp = await earningService.performerStats({
      ...filter
    });
    resp.data && this.setState({ stats: resp.data });
  }

  render() {
    const {
      loading, earning, pagination, stats
    } = this.state;
    const { ui } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui?.siteName} | Earnings`}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading icon={<DollarOutlined />} title="Earnings" />
          <div className="notify-banner bordered">
            <p>
              The payments will be done automatically to your bank account at the end of each month
              Min. Limits:
            </p>
            <p>
              For SEPA transfer min $20 - cost $0.75 per transaction
            </p>
            <p>
              For Int. wire min $100 - cost $25 per transaction
            </p>
          </div>
          <SearchFilter
            type={[
              { key: '', text: 'All types' },
              { key: 'product', text: 'Product' },
              { key: 'message', text: 'Message' },
              { key: 'gallery', text: 'Gallery' },
              { key: 'feed', text: 'Post' },
              { key: 'video', text: 'Video' },
              { key: 'tip', text: 'Tip' },
              { key: 'stream_tip', text: 'Streaming tip' },
              { key: 'public_chat', text: 'Paid steaming' },
              { key: 'private_chat', text: 'Private steaming' },
              { key: 'referral', text: 'Referral' },
              { key: 'trial_subscription', text: 'Trial Subscription' },
              { key: 'monthly_subscription', text: 'Monthly Subscription' },
              { key: 'six_month_subscription', text: 'Six Months Subscription' },
              { key: 'one_time_subscription', text: 'One Time Subscription' }
            ]}
            onSubmit={this.handleFilter.bind(this)}
            searchPayoutStatus
            dateRange
          />
          <div className="stats-earning">
            <Statistic
              title="Total"
              prefix="$"
              value={stats?.totalGrossPrice?.toFixed(2) || 0}
              precision={2}
            />
            <Statistic
              title="Platform commission"
              prefix="$"
              value={stats?.totalSiteCommission?.toFixed(2) || 0}
              precision={2}
            />
            <Statistic
              title="Your Earnings"
              prefix="$"
              value={stats?.totalNetPrice?.toFixed(2) || 0}
              precision={2}
            />
            <Statistic
              title="Total Paid"
              prefix="$"
              value={stats?.totalPaidAmount?.toFixed(2) || 0}
              precision={2}
            />
            <Statistic
              title="Total Unpaid"
              prefix="$"
              value={stats?.totalUnpaidAmount?.toFixed(2) || 0}
              precision={2}
            />
          </div>
          <div className="table-responsive">
            <TableListEarning
              dataSource={earning}
              rowKey="_id"
              pagination={pagination}
              loading={loading}
              onChange={this.handleTabsChange.bind(this)}
            />
          </div>
        </div>
      </Layout>
    );
  }
}

const mapStates = (state) => ({
  ui: { ...state.ui },
  performer: { ...state.user.current }
});
export default connect(mapStates)(EarningPage);
