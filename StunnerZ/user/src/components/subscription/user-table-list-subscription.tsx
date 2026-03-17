/* eslint-disable react/destructuring-assignment */
import {
  Table, Tag, Button, Tooltip, Avatar
} from 'antd';
import { ISubscription } from 'src/interfaces';
import { formatDateNotSecond, nowIsBefore } from '@lib/date';
import Router from 'next/router';
import { MessageIcon } from 'src/icons';

interface IProps {
  dataSource: ISubscription[];
  pagination: any;
  rowKey: string;
  onChange: any;
  loading: boolean;
}

export const TableListSubscription = ({
  dataSource,
  pagination,
  rowKey,
  onChange,
  loading
}: IProps) => {
  const columns = [
    {
      title: 'User',
      render(records: any) {
        return (
          <span>
            <Avatar src={records?.userInfo?.avatar || '/static/no-avatar.png'} />
            {' '}
            {records?.userInfo?.name || records?.userInfo?.username || 'N/A'}
          </span>
        );
      }
    },
    {
      title: 'Message',
      render(records: any) {
        const isDisable = records.status !== 'active';
        return (
          <Tooltip title="Send Message" className="send-message-tooltip">
            <Button
              className="primary"
              style={{
                padding: 2,
                height: 25,
                width: '100%'
              }}
              icon={<MessageIcon />}
              onClick={() => Router.push({
                pathname: '/sexting',
                query: {
                  toSource: 'user',
                  toId: records.userId || ''
                }
              })}
              disabled={isDisable}
            />

          </Tooltip>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'subscriptionType',
      render(subscriptionType: string) {
        switch (subscriptionType) {
          case 'monthly': return <Tag color="blue">Monthly Subscription</Tag>;
          case 'six_month': return <Tag color="green">Six Months Subscription</Tag>;
          case 'one_time': return <Tag color="purple">One Time Subscription</Tag>;
          case 'trial': return <Tag color="orange">Trial Subscription</Tag>;
          case 'system': return <Tag color="green">System</Tag>;
          default:
            return <Tag color="#FFCF00">{subscriptionType}</Tag>;
        }
      }
    },
    {
      title: 'Start Date',
      dataIndex: 'createdAt',
      render(date: Date) {
        return <span>{formatDateNotSecond(date, 'll')}</span>;
      }
    },
    {
      title: 'Start recurring date',
      dataIndex: 'startRecurringDate',
      render(date: Date, record) {
        if (record.subscriptionType === 'one_time') {
          return <span>N/A</span>;
        }
        return <span>{record.status === 'active' && formatDateNotSecond(date, 'll')}</span>;
      }
    },
    {
      title: 'Renewal Date',
      dataIndex: 'nextRecurringDate',
      render(date: Date, record) {
        if (record.subscriptionType === 'one_time') {
          return <span>N/A</span>;
        }
        return <span>{record.status === 'active' && formatDateNotSecond(date, 'll')}</span>;
      }
    },
    {
      title: 'PM Gateway',
      dataIndex: 'paymentGateway',
      render(paymentGateway: string) {
        switch (paymentGateway) {
          case 'verotel':
            return <Tag color="blue">Verotel</Tag>;
          default:
            return <Tag color="default">{paymentGateway}</Tag>;
        }
      }
    },
    {
      title: 'Updated on',
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDateNotSecond(date)}</span>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(status: string, record: ISubscription) {
        if (!nowIsBefore(record.expiredAt)) {
          return <Tag color="red">Suspended</Tag>;
        }
        switch (status) {
          case 'active':
            return <Tag color="#00c12c">Active</Tag>;
          case 'deactivated':
            return <Tag color="#FFCF00">Inactive</Tag>;
          default:
            return <Tag color="pink">{status}</Tag>;
        }
      }
    }
  ];
  return (
    <div className="table-responsive">
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        pagination={pagination}
        onChange={onChange}
        loading={loading}
      />
    </div>
  );
};
