/* eslint-disable react/destructuring-assignment */
import { Table, Tag } from 'antd';
import { formatDateNotSecond } from '@lib/date';
import { IEarning } from 'src/interfaces';

interface IProps {
  dataSource: IEarning[];
  rowKey: string;
  pagination: {};
  onChange: Function;
  loading: boolean;
}

const TableListEarning = ({
  dataSource,
  rowKey,
  pagination,
  onChange,
  loading
}: IProps) => {
  const columns = [
    {
      title: 'User',
      dataIndex: 'userInfo',
      render(userInfo) {
        return (
          <span>
            {userInfo?.name || userInfo?.username || 'N/A'}
          </span>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'sourceType',
      render(sourceType: string) {
        switch (sourceType) {
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
          case 'referral':
            return <Tag color="pink">Referral</Tag>;
          case 'private_chat':
          return <Tag color="purple">Private Chat</Tag>;
          default: return <Tag color="success">{sourceType}</Tag>;
        }
      }
    },
    {
      title: 'GROSS',
      dataIndex: 'source',
      render(source) {
        return (
          <span style={{ whiteSpace: 'nowrap' }}>
            {`$${(source?.grossPrice || 0).toFixed(2)}`}
          </span>
        );
      }
    },
    {
      title: 'Commission',
      dataIndex: 'source',
      render(source) {
        return (
          <span>
            {`${(source?.siteCommission || 0) * 100}%`}
          </span>
        );
      }
    },
    {
      title: 'Commission paid',
      dataIndex: 'source',
      render(source, record) {
        return (
          <span>
            {record.sourceType === 'referral' ? `- $${(source?.netPrice || 0).toFixed(2)}` : `$${(source?.grossPrice - source?.netPrice - source?.subPerformerPrice || 0).toFixed(2)}`}
          </span>
        );
      }
    },
    {
      title: 'Referral Commission',
      dataIndex: 'source',
      render(source) {
        return (
          <span>
            {`${(source?.referralCommission || 0) * 100}%`}
          </span>
        );
      }
    },
    {
      title: 'NET',
      dataIndex: 'source',
      render(source) {
        return (
          <span style={{ whiteSpace: 'nowrap' }}>
            {`$${(source?.netPrice || 0).toFixed(2)}`}
          </span>
        );
      }
    },
    // {
    //   title: 'Account Managed',
    //   dataIndex: 'subPerformerInfo',
    //   render(subPerformerInfo) {
    //     return (
    //       <span style={{ whiteSpace: 'nowrap' }}>
    //         {subPerformerInfo?.name}
    //       </span>
    //     );
    //   }
    // },
    {
      title: 'Agency Commission',
      dataIndex: 'source',
      render(source) {
        return (
          <span>
            {`${(source?.subPerformerCommission || 0) * 100}%`}
          </span>
        );
      }
    },
    {
      title: 'Agency Earned',
      dataIndex: 'source',
      render(source) {
        return (
          <span style={{ whiteSpace: 'nowrap' }}>
            {`$${(source?.subPerformerPrice || 0).toFixed(2)}`}
          </span>
        );
      }
    },
    {
      title: 'Payout status',
      dataIndex: 'isPaid',
      render(isPaid: boolean) {
        switch (isPaid) {
          case true:
            return <Tag color="green">Y</Tag>;
          case false:
            return <Tag color="red">N</Tag>;
          default:
            return <Tag color="red">{isPaid}</Tag>;
        }
      }
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span style={{ whiteSpace: 'nowrap' }}>{formatDateNotSecond(date)}</span>;
      }
    },
    {
      title: 'Update At',
      dataIndex: 'updateAt',
      sorted: true,
      render(updateAt: Date) {
        return <span>{formatDateNotSecond(updateAt)}</span>;
      }
    }
  ];
  return (
    <div className="table-responsive">
      <Table
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        pagination={pagination}
        onChange={onChange.bind(this)}
      />
    </div>
  );
};

export default TableListEarning;
