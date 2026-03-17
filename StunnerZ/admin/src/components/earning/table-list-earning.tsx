/* eslint-disable no-nested-ternary */
/* eslint-disable react/destructuring-assignment */
import {
  Button, message, Table, Tag
} from 'antd';
import { formatDate } from '@lib/date';
import React, { useEffect, useState } from 'react';
import { earningService } from '@services/earning.service';
import { uniq, intersection, difference } from 'lodash';
import moment from 'moment';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
  filter: any;
  handleUpdateSuccess: Function;
  performerId: string;
}

const TableListEarning = ({
  dataSource,
  rowKey,
  loading,
  pagination,
  onChange,
  filter,
  handleUpdateSuccess,
  performerId
}: IProps) => {
  const columns = [
    {
      title: 'Model',
      dataIndex: 'performerInfo',
      key: 'performer',
      render(performerInfo) {
        return (
          <div>
            {performerInfo?.name || performerInfo?.username || 'N/A'}
          </div>
        );
      }
    },
    {
      title: 'Source of income',
      dataIndex: 'userInfo',
      key: 'user',
      render(userInfo) {
        return (
          <div>
            {userInfo?.name || userInfo?.username || 'N/A'}
          </div>
        );
      }
    },
    {
      title: 'Role',
      dataIndex: 'source',
      render(source) {
        switch (source?.registerSource) {
          case 'performer':
            return <Tag color="cyan">Model</Tag>;
          case 'user':
            return <Tag color="geekblue">Fan</Tag>;
          default: return <Tag color="geekblue">Fan</Tag>;
        }
      }
    },
    {
      title: 'Total',
      dataIndex: 'source',
      render(source, record) {
        return (
          <span>
            {record.sourceType === 'referral' ? `${(record.source.grossPrice || 0).toFixed(2)}` : `$${(source?.grossPrice || 0).toFixed(2)}`}
          </span>
        );
      }
    },
    {
      title: 'Model Earned',
      dataIndex: 'source',
      render(source) {
        return (
          <span>
            {`$${(source?.netPrice || 0).toFixed(2)}`}
          </span>
        );
      }
    },
    {
      title: 'Site Earned',
      dataIndex: 'source',
      render(source, record) {
        const price = Number(source?.grossPrice) - Number(source?.netPrice) - Number(source?.subPerformerPrice || 0);
        return (
          <span>
            {record.sourceType === 'referral' ? `- $${(source?.netPrice || 0).toFixed(2)}` : `$${(price ? price : 0).toFixed(2)}`}
          </span>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'sourceType',
      render(sourceType: string) {
        switch (sourceType) {
          case 'product':
            return <Tag color="#FFCF00">Product</Tag>;
          case 'gallery':
            return <Tag color="#FFCF00">Gallery</Tag>;
          case 'feed':
            return <Tag color="green">Post</Tag>;
          case 'tip':
            return <Tag color="#00dcff">Tip</Tag>;
          case 'video':
            return <Tag color="blue">Video</Tag>;
          case 'stream_tip':
            return <Tag color="violet">Streaming Tip</Tag>;
          case 'public_chat':
            return <Tag color="pink">Paid Streaming</Tag>;
          case 'referral':
            return <Tag color="pink">Referral</Tag>;
          case 'monthly_subscription':
            return <Tag color="blue">Monthly Sub</Tag>;
          case 'six_month_subscription':
            return <Tag color="green">Six Months Sub</Tag>;
          case 'one_time_subscription':
            return <Tag color="purple">One Time Sub</Tag>;
          case 'private_chat':
            return <Tag color="purple">Private Chat</Tag>;
          default: return <Tag color="red">{sourceType}</Tag>;
        }
      }
    },
    {
      title: 'Agency Name',
      dataIndex: 'subPerformerInfo',
      render(subPerformerInfo) {
        return (
          <span>
            {subPerformerInfo?.name || subPerformerInfo?.username}
          </span>
        );
      }
    },
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
      title: 'Latest Payment',
      dataIndex: 'latestPayment',
      render(latestPayment: boolean) {
        switch (latestPayment) {
          case true:
            return <Tag color="green">Y</Tag>;
          case false:
            return <Tag color="red">N</Tag>;
          default:
            return <Tag color="red">N</Tag>;
        }
      }
    },
    {
      title: 'Create At',
      dataIndex: 'createdAt',
      sorted: true,
      render(createdAt: Date) {
        return <span>{formatDate(createdAt)}</span>;
      }
    },
    {
      title: 'Update At',
      dataIndex: 'updateAt',
      sorter: (a: any, b: any) => moment(a.updateAt).unix() - moment(b.updateAt).unix(),
      defaultSortOrder: 'descend',
      render(updateAt: Date) {
        return <span>{formatDate(updateAt)}</span>;
      }
    }
  ];

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleUpdatePaidStatus = async () => {
    // if (performerId === '') {
    //   message.error('Please select model need update!');
    //   return;
    // }
    if (!selectedRowKeys?.length) {
      message.error('Please select item need update!');
      return;
    }
    if (!window.confirm('Are you sure you want confirm payment, after confirm can\'t change status payment!')) {
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        performerId,
        groupEarningIds: selectedRowKeys,
        isPaid: filter?.isPaid === 'true' ? true : filter?.isPaid === 'false' && false
      };
      await earningService.updateGroupEarningStatus(payload);
      setSelectedRowKeys([]);
      message.success('Updated status success!');
      handleUpdateSuccess && handleUpdateSuccess();
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Update failed please try again!');
    } finally {
      setSubmitting(false);
    }
  };

  const onSelectChange = (newRowKeys) => {
    setSelectedRowKeys((prev) => {
      const dataIds = dataSource.map((d: any) => d._id.toString());
      const temp = difference(prev, intersection(prev, dataIds));
      const result = uniq([...temp, ...newRowKeys]);
      return result;
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record: any) => ({
      disabled: record?.isPaid === true // Column configuration not to be checked
    })
  };

  const hasSelected = selectedRowKeys.length > 0;

  useEffect(() => {
    setSelectedRowKeys([]);
  }, [filter]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleUpdatePaidStatus} loading={submitting}>
          Make payment
        </Button>
        <span style={{ marginLeft: 8 }}>
          {hasSelected ? `Selected ${selectedRowKeys.length} items` : ''}
        </span>
      </div>
      <Table
        rowSelection={rowSelection}
        dataSource={dataSource}
        columns={columns as any}
        rowKey={rowKey}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: true }}
        onChange={onChange.bind(this)}
      />
    </div>
  );
};

export default TableListEarning;
