import { formatDate } from '@lib/date';
import { Table, Tag } from 'antd';

interface IProps {
  rowKey: string,
  dataSource: [],
  loading: boolean,
  onChange: Function
}

function TableListReferralEarning({
  rowKey, dataSource, loading, onChange
}: IProps) {
  const columns = [
    {
      title: 'Referred person',
      render(data, record) {
        return <span>{record?.registerInfo?.name || record?.registerInfo?.username}</span>;
      }
    },
    {
      title: 'Presenter',
      render(data, record) {
        return <span>{record?.referralInfo?.name || record?.referralInfo?.username}</span>;
      }
    },
    {
      title: 'Role',
      render(data, record) {
        switch (record?.registerSource) {
          case 'performer':
            return <Tag color="cyan">Model</Tag>;
          case 'user':
            return <Tag color="geekblue">Fan</Tag>;
          default: return <Tag color="default">{record?.registerSource}</Tag>;
        }
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render(type) {
        switch (type) {
          case 'trial_subscription':
            return <Tag color="red">Trial Subscription</Tag>;
          case 'monthly_subscription':
            return <Tag color="red">Monthly Subscription</Tag>;
          case 'six_month_subscription':
            return <Tag color="red">Six Months Subscription</Tag>;
          case 'one_time_subscription':
            return <Tag color="red">One Time Subscription</Tag>;
          case 'public_chat':
            return <Tag color="violet">Paid Streaming</Tag>;
          case 'feed':
            return <Tag color="green">Post</Tag>;
          case 'tip':
            return <Tag color="orange">Tip</Tag>;
          case 'gift':
            return <Tag color="orange">Gift</Tag>;
          case 'message':
            return <Tag color="pink">Message</Tag>;
          case 'product':
            return <Tag color="blue">Product</Tag>;
          case 'gallery':
            return <Tag color="success">Gallery</Tag>;
          case 'stream_tip':
            return <Tag color="orange">Streaming tip</Tag>;
          default:
            return <Tag color="success">{type}</Tag>;
        }
      }
    },
    {
      title: 'GROSS Price',
      render(data, record) {
        return (
          <span>
            {`$${(record?.grossPrice || 0).toFixed(2)}`}
          </span>
        );
      }
    },
    {
      title: 'NET Price',
      render(data, record) {
        return (
          <span>
            {`$${(record?.netPrice || 0).toFixed(2)}`}
          </span>
        );
      }
    },
    {
      title: 'Referral Commission',
      render(data, record) {
        return (
          <span>
            {(record?.referralCommission || 0) * 100}
            %
          </span>
        );
      }
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    }
  ];

  return (
    <Table
      rowKey={rowKey}
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      onChange={onChange.bind(this)}
      pagination={{ showSizeChanger: false }}
    />
  );
}

export default TableListReferralEarning;
