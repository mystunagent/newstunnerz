import Head from 'next/head';
import { PureComponent } from 'react';
import {
  Table, message, Tag
} from 'antd';
import Page from '@components/common/layout/page';
import { performerService } from '@services/performer.service';
import BankingSearchFilter from '@components/performer/banking-search-filter';
import { BreadcrumbComponent } from '@components/common';
import { IPerformer } from 'src/interfaces';
import { formatDate } from '@lib/date';
import SubBankingSearchFilter from '@components/performer/sub-banking-search-filter';
import moment from 'moment';

interface IProps {
  status: string;
  verifiedDocument: string;
}

export default class SubPerformerEarnings extends PureComponent<IProps> {
  _selectedUser: IPerformer;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: false,
    list: [],
    limit: 10,
    filter: {
      bankingType: 'sepa',
      q: ''
    },
    sortBy: 'updatedAt',
    sort: 'desc'
  };

  componentDidMount() {
    this.search();
  }

  async handleTableChange(pagination, filters, sorter) {
    const pager = { ...pagination };
    pager.current = pagination.current;
    await this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updatedAt',
      // eslint-disable-next-line no-nested-ternary
      sort: sorter.order ? (sorter.order === 'descend' ? 'desc' : 'asc') : 'desc'
    });
    this.search(pager.current);
  }

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.search();
  }

  async search(page = 1) {
    const {
      limit, sort, filter, sortBy, pagination
    } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await performerService.searchSubBanking({
        limit,
        offset: (page - 1) * limit,
        ...filter,
        sort,
        sortBy
      });
      this.setState({
        searching: false,
        list: resp.data.data,
        pagination: {
          ...pagination,
          total: resp.data.total
        }
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  render() {
    const {
      list, searching, pagination, filter
    } = this.state;
    const sepaColumns = [
      {
        title: 'Agency',
        dataIndex: 'name',
        render(name: string) {
          return <span>{name}</span>;
        }
      },
      {
        title: 'Source of income',
        dataIndex: 'infoSubPerformer',
        render(infoSubPerformer: any) {
          return <span>{infoSubPerformer?.name || infoSubPerformer?.username}</span>;
        }
      },
      // {
      //   title: 'Commission %',
      //   dataIndex: 'commissionPercentage',
      //   render: (commissionPercentage: number) => <span>{`${commissionPercentage * 100}%`}</span>
      // },
      {
        title: 'Banking Type',
        render() {
          switch (filter.bankingType) {
            case 'wire':
              return <Tag color="green">Int. wire</Tag>;
            case 'sepa':
              return <Tag color="red">Sepa</Tag>;
            default: return null;
          }
        }
      },
      {
        title: 'Beneficiary name',
        render(record: any) {
          return <span>{record?.bankingInformation?.sepa_beneficiary_name}</span>;
        }
      },
      {
        title: 'Beneficiary IBAN',
        render(record: any) {
          return <span>{record?.bankingInformation?.sepa_beneficiary_iban}</span>;
        }
      },
      {
        title: 'Currency',
        render(record: any) {
          return <span>{record?.bankingInformation?.sepa_currency}</span>;
        }
      },
      {
        title: 'Total Paid',
        dataIndex: 'totalPaidAmount',
        render: (totalPaidAmount: number) => <span>{`$${totalPaidAmount?.toFixed(2)}`}</span>
      },
      {
        title: 'Total Earning',
        dataIndex: 'earnedAmount',
        render: (earnedAmount: number) => <span>{`$${earnedAmount?.toFixed(2)}`}</span>
      },
      {
        title: 'Total Unpaid',
        dataIndex: 'totalUnpaidAmount',
        render: (totalUnpaidAmount: number) => <span>{`$${totalUnpaidAmount?.toFixed(2)}`}</span>
      },
      {
        title: 'Payment Date',
        dataIndex: 'latestPaymentDate',
        sorter: (a: any, b: any) => moment(a.latestPaymentDate).unix() - moment(b.latestPaymentDate).unix(),
        defaultSortOrder: 'desc',
        render(latestPaymentDate: Date) {
          return <span>{latestPaymentDate ? formatDate(latestPaymentDate) : null}</span>;
        }
      }
    ];

    const wireColumns = [
      {
        title: 'Display Name',
        dataIndex: 'name',
        render(name: string) {
          return <span>{name}</span>;
        }
      },
      // {
      //   title: 'Commission %',
      //   dataIndex: 'commissionPercentage',
      //   render: (commissionPercentage: number) => <span>{`${commissionPercentage * 100}%`}</span>
      // },
      {
        title: 'Banking Type',
        render() {
          switch (filter.bankingType) {
            case 'wire':
              return <Tag color="green">Int. wire</Tag>;
            case 'sepa':
              return <Tag color="red">Sepa</Tag>;
            default: return null;
          }
        }
      },
      {
        title: 'Beneficiary name',
        render(record: any) {
          return <span>{record?.bankingInformation?.beneficiary_name}</span>;
        }
      },
      {
        title: 'Beneficiary Street',
        render(record: any) {
          return <span>{record?.bankingInformation?.beneficiary_street}</span>;
        }
      },
      {
        title: 'City',
        render(record: any) {
          return <span>{record?.bankingInformation?.beneficiary_city}</span>;
        }
      },
      {
        title: 'Beneficiary postal code',
        render(record: any) {
          return <span>{record?.bankingInformation?.beneficiary_postal_code}</span>;
        }
      },
      {
        title: 'Beneficiary country code',
        render(record: any) {
          return <span>{record?.bankingInformation?.beneficiary_country_code}</span>;
        }
      },
      {
        title: 'Beneficiary account',
        render(record: any) {
          return <span>{record?.bankingInformation?.beneficiary_account}</span>;
        }
      },
      {
        title: 'BIC code',
        render(record: any) {
          return <span>{record?.bankingInformation?.bic_code}</span>;
        }
      },
      {
        title: 'Intermediary bank bic code',
        render(record: any) {
          return <span>{record?.bankingInformation?.intermediary_bank_bic_code}</span>;
        }
      },
      {
        title: 'Currency',
        render(record: any) {
          return <span>{record?.bankingInformation?.sepa_currency}</span>;
        }
      },
      {
        title: 'Amount',
        dataIndex: 'totalLatestPaymentAmount',
        render: (totalLatestPaymentAmount: number) => <span>{totalLatestPaymentAmount ? `$${totalLatestPaymentAmount?.toFixed(2)}` : null}</span>
      },
      {
        title: 'Total Paid',
        dataIndex: 'totalPaidAmount',
        render: (totalPaidAmount: number) => <span>{`$${totalPaidAmount?.toFixed(2)}`}</span>
      },
      {
        title: 'Total Earning',
        dataIndex: 'earnedAmount',
        render: (earnedAmount: number) => <span>{`$${earnedAmount?.toFixed(2)}`}</span>
      },
      {
        title: 'Total Unpaid',
        dataIndex: 'totalUnpaidAmount',
        render: (totalUnpaidAmount: number) => <span>{`$${totalUnpaidAmount?.toFixed(2)}`}</span>
      },
      {
        title: 'Payment Date',
        dataIndex: 'latestPaymentDate',
        sorter: (a: any, b: any) => moment(a.latestPaymentDate).unix() - moment(b.latestPaymentDate).unix(),
        // defaultSortOrder: 'desc',
        render(latestPaymentDate: Date) {
          return <span>{latestPaymentDate ? formatDate(latestPaymentDate) : null}</span>;
        }
      }
    ];
    return (
      <>
        <Head>
          <title>Model Earnings</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Models' }]} />
        <Page>
          <SubBankingSearchFilter
            onSubmit={this.handleFilter.bind(this)}
            bankingType="sepa"
          />
          <div className="table-responsive custom">
            <Table
              dataSource={list}
              columns={
                filter?.bankingType === 'sepa' ? sepaColumns : wireColumns
              }
              rowKey="_id"
              loading={searching}
              pagination={{ ...pagination, showSizeChanger: false }}
              onChange={this.handleTableChange.bind(this)}
            />
          </div>
        </Page>
      </>
    );
  }
}
