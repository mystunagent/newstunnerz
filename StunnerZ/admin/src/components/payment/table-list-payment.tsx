/* eslint-disable react/destructuring-assignment */
import { Table, Tag } from 'antd';
import { formatDate } from '@lib/date';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
}

const TableListPaymentTransaction = ({
  dataSource, rowKey, loading, pagination, onChange
}: IProps) => {
  const columns = [
    {
      title: 'User',
      dataIndex: 'sourceInfo',
      key: 'sourceInfo',
      render: (sourceInfo: any) => <div>{sourceInfo?.name || sourceInfo?.username || 'N/A'}</div>
    },
    {
      title: 'Description',
      key: 'description',
      render: (record: any) => <span>{record?.products && record?.products[0] && record?.products[0].name}</span>

    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        switch (type) {
          case 'token_package': return <Tag color="blue">Wallet Purchase</Tag>;
          case 'one_time_subscription': return <Tag color="purple">One Time Subscription</Tag>;
          case 'monthly_subscription': return <Tag color="orange">Monthly Subscription</Tag>;
          case 'six_month_subscription': return <Tag color="magenta">Six Months Subscription</Tag>;
          case 'yearly_subscription': return <Tag color="red">Yearly Subscription</Tag>;
          case 'free_subscription': return <Tag color="green">Free Subscription</Tag>;
          case 'trial_subscription': return <Tag color="yellow">Trial Subscription</Tag>;
          default: return <Tag>{type}</Tag>;
        }
      }
    },
    {
      title: 'Original price',
      dataIndex: 'originalPrice',
      render: (originalPrice) => <span>{`$${(originalPrice || 0).toFixed(2)}`}</span>
    },
    {
      title: 'Transaction cost',
      dataIndex: 'transactionCost',
      render: (transactionCost) => <span>{`$${(transactionCost || 0).toFixed(2)}`}</span>
    },
    {
      title: 'Discount',
      dataIndex: 'couponInfo',
      render: (couponInfo, record) => <span>{`${(couponInfo?.value || 0) * 100}% - $${((couponInfo?.value || 0) * (record?.originalPrice || 0)).toFixed(2)}`}</span>

    },
    {
      title: 'End Price',
      dataIndex: 'totalPrice',
      render: (totalPrice) => <span>{`$${(totalPrice || 0).toFixed(2)}`}</span>
    },
    {
      title: 'Payment status',
      dataIndex: 'status',
      render: (status: string) => {
        switch (status) {
          case 'success': return <Tag color="green">Success</Tag>;
          case 'fail': return <Tag color="red">Fail</Tag>;
          case 'processing': return <Tag color="orange">Processing</Tag>;
          case 'canceled': return <Tag color="pink">Canceled</Tag>;
          case 'refunded': return <Tag color="violet">Refunded</Tag>;
          case 'created': return <Tag color="default">Created</Tag>;
          case 'require_authentication': return <Tag color="default">Require Authentication</Tag>;
          default: return <Tag color="red">{status}</Tag>;
        }
      }
    },
    {
      title: 'Gateway',
      dataIndex: 'paymentGateway',
      render: (paymentGateway: string) => {
        switch (paymentGateway) {
          case 'verotel': return <Tag color="blue">Verotel</Tag>;
          default: return <Tag color="red">{paymentGateway}</Tag>;
        }
      }
    },
    {
      title: 'Updated On',
      dataIndex: 'updatedAt',
      sorter: true,
      fixed: 'right' as 'right',
      render: (date: Date) => <span>{formatDate(date)}</span>
    }
  ];
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      rowKey={rowKey}
      loading={loading}
      pagination={{ ...pagination, showSizeChanger: false }}
      onChange={onChange.bind(this)}
    />
  );
};

export default TableListPaymentTransaction;
