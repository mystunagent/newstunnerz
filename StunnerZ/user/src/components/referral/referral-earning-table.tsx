import { IReferral } from '@interfaces/referral';
import { formatDateNotSecond } from '@lib/date';
import { Table, Tag } from 'antd';

interface IProps {
  dataSource: IReferral[];
  loading: boolean;
  rowKey: string;
  onChange: Function;
  pagination: { total, pageSize}
}

function TableListReferralEarning({
  dataSource, loading, rowKey, onChange, pagination
}: IProps) {
  const columns = [
    {
      title: 'Gross Price',
      render(data, record) {
        return (
          <span>
            {`$${record?.grossPrice}`}
          </span>
        );
      }
    },
    {
      title: 'Commission Rate',
      render(data, record) {
        return (
          <span>
            {`${(record?.referralCommission || 0) * 100}%`}
          </span>
        );
      }
    },
    {
      title: 'Commission',
      dataIndex: 'netPrice',
      render(netPrice: number) {
        return (
          <Tag color="green">
            {`+$${(netPrice || 0).toFixed(2)}`}
          </Tag>
        );
      }
    },
    {
      title: 'Name',
      render(data, record) {
        return (
          <span>{record?.registerInfo?.name}</span>
        );
      }
    },
    {
      title: 'Role',
      render(data, record) {
        switch (record?.registerSource) {
          case 'performer':
            return <Tag color="cyan">Creator</Tag>;
          case 'user':
            return <Tag color="geekblue">Fan</Tag>;
          default: return <Tag color="default">{record?.registerSource}</Tag>;
        }
      }
    },
    {
      title: 'Updated On',
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDateNotSecond(date)}</span>;
      }
    }
  ];
  return (
    <div className="table-responsive">
      <Table
        rowKey={rowKey}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        onChange={onChange.bind(this)}
        pagination={pagination.total <= pagination.pageSize ? false : pagination}
      />
    </div>
  );
}

export default TableListReferralEarning;
