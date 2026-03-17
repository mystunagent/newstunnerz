/* eslint-disable jsx-a11y/label-has-associated-control */
import {
  Layout, message, Select, Button, PageHeader,
  Input, Space, Statistic, Divider, Avatar
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import { ICountry, IPayoutRequest } from 'src/interfaces';
import { BreadcrumbComponent } from '@components/common/breadcrumb';
import Page from '@components/common/layout/page';
import { payoutRequestService, utilsService } from 'src/services';
import Router from 'next/router';
import { getResponseError } from '@lib/utils';
import { formatDate } from 'src/lib/date';

const { Content } = Layout;

interface IProps {
  id: string;
  countries: ICountry[]
}

interface IStates {
  request: IPayoutRequest;
  loading: boolean;
  status: string;
  adminNote: any;
  statsPayout: {
    totalEarnedTokens: number;
    previousPaidOutTokens: number;
    remainingUnpaidTokens: number;
  }
}

class PayoutDetailPage extends PureComponent<IProps, IStates> {
  static async getInitialProps({ ctx }) {
    const [countries] = await Promise.all([
      utilsService.countriesList()
    ]);
    return { ...ctx.query, countries: countries?.data || [] };
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      request: null,
      loading: true,
      status: '',
      adminNote: '',
      statsPayout: {
        totalEarnedTokens: 0,
        previousPaidOutTokens: 0,
        remainingUnpaidTokens: 0
      }
    };
  }

  componentDidMount() {
    this.getData();
  }

  async onUpdate() {
    const { status, adminNote, request } = this.state;
    try {
      await this.setState({ loading: true });
      await payoutRequestService.update(request._id, {
        status,
        adminNote
      });
      message.success('Updated successfully');
      Router.replace('/payout-request');
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err), 10);
    } finally {
      this.setState({ loading: false });
    }
  }

  async getData() {
    const { id } = this.props;
    try {
      await this.setState({ loading: true });
      const resp = await payoutRequestService.findById(id);
      this.getStatsPayout(resp.data.sourceId);
      await this.setState({
        request: resp.data,
        status: resp.data.status,
        adminNote: resp.data.adminNote
      });
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      this.setState({ loading: false });
    }
  }

  async getStatsPayout(performerId: string) {
    try {
      const resp = await payoutRequestService.calculate({
        performerId
      });
      this.setState({
        statsPayout: resp.data
      });
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { countries = [] } = this.props;
    const {
      request, adminNote, loading, statsPayout, status
    } = this.state;
    const paymentAccountInfo = request?.paymentAccountInfo;
    const country = countries && countries.find((c) => c.code === paymentAccountInfo?.country);
    return (
      <Layout>
        <Head>
          <title>Payout Request Details</title>
        </Head>
        <Content>
          <div className="main-container">
            <BreadcrumbComponent
              breadcrumbs={[
                { title: 'Payout Requests', href: '/payout-request' },
                {
                  title: 'Payout Request Details'
                }
              ]}
            />
            {request ? (
              <Page>
                <PageHeader title="Payout Request Details" />
                <div style={{ margin: '20px 0', textAlign: 'center', width: '100%' }}>
                  <Space size="large">
                    <Statistic
                      prefix="$"
                      title="Total Price"
                      value={statsPayout?.totalEarnedTokens || 0}
                      precision={2}
                    />
                    <Statistic
                      prefix="$"
                      title="Paid Out Price"
                      value={statsPayout?.previousPaidOutTokens || 0}
                      precision={2}
                    />
                    <Statistic
                      prefix="$"
                      title="Remaining Price"
                      value={statsPayout?.remainingUnpaidTokens || 0}
                      precision={2}
                    />
                  </Space>
                </div>
                <p>
                  Model:
                  {' '}
                  <strong>
                    <Avatar src={request?.sourceInfo?.avatar || '/no-avatar.png'} />
                    {' '}
                    {request?.sourceInfo?.name || request?.sourceInfo?.username || 'N/A'}
                  </strong>
                </p>
                <p>
                  Requested amount of tokens:
                  {' '}
                  {request.requestTokens.toFixed(2) || 0}
                </p>
                <p>
                  Conversion rate:
                  {' '}
                  $
                  {((request.requestTokens || 0) * (request.tokenConversionRate || 1)).toFixed(2)}
                </p>
                <p>
                  Requested on:
                  {' '}
                  {formatDate(request.createdAt)}
                </p>
                <p>
                  Note from the model
                  {' '}
                  {request.requestNote}
                </p>
                <Divider />
                {request.paymentAccountType === 'banking' && (
                <div>
                  <h2>
                    Confirm transfer via Banking
                  </h2>
                  <p>
                    Bank name:
                    {' '}
                    {paymentAccountInfo?.bankName || 'N/A'}
                  </p>
                  <p>
                    Bank account number:
                    {' '}
                    {paymentAccountInfo?.bankAccount || 'N/A'}
                  </p>
                  <p>
                    Bank account:
                    {' '}
                    {`${paymentAccountInfo?.firstName} ${paymentAccountInfo?.lastName}`}
                  </p>
                  <p>
                    Bank routing:
                    {' '}
                    {paymentAccountInfo?.bankRouting || 'N/A'}
                  </p>
                  <p>
                    Bank swift code:
                    {' '}
                    {paymentAccountInfo?.bankSwiftCode || 'N/A'}
                  </p>
                  <p>
                    Country:
                    {' '}
                    {paymentAccountInfo?.country ? (
                      <span>
                        <img src={country?.flag} alt="flag" width="20px" />
                        {' '}
                        {country?.name}
                      </span>
                    ) : 'N/A' }
                  </p>
                </div>
                )}
                <Divider />
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ color: 'red' }}>
                    Please update the below status manually after the transaction is processed
                  </p>
                  <Select
                    disabled={loading || ['done', 'rejected'].includes(request?.status)}
                    style={{ width: '100%' }}
                    onChange={(e) => this.setState({ status: e })}
                    value={status}
                  >
                    <Select.Option key="pending" value="pending">
                      Pending
                    </Select.Option>
                    <Select.Option key="rejected" value="rejected">
                      Rejected
                    </Select.Option>
                    <Select.Option key="done" value="done">
                      Done
                    </Select.Option>
                  </Select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <p>Note to the model: </p>
                  <Input.TextArea
                    defaultValue={adminNote}
                    style={{ width: '100%' }}
                    onChange={(v) => {
                      this.setState({ adminNote: v.target.value });
                    }}
                    placeholder="Write your message here"
                    autoSize={{ minRows: 3 }}
                  />
                </div>
                <div style={{ marginBottom: '10px', display: 'flex' }}>
                  <Button
                    type="primary"
                    onClick={this.onUpdate.bind(this)}
                  >
                    Update
                  </Button>
                  &nbsp;
                  <Button
                    type="default"
                    onClick={() => Router.back()}
                  >
                    Back
                  </Button>
                </div>
              </Page>
            ) : (
              <p>Request not found.</p>
            )}
          </div>
        </Content>
      </Layout>
    );
  }
}

export default PayoutDetailPage;
