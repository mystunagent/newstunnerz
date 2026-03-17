import { formatDate } from '@lib/date';
import { Table, Tag } from 'antd';

interface IProps {
  rowKey: string,
  loading: boolean,
  dataSource: [],
  pagination: {},
  onChange: Function
}

function TableListReferral({
  dataSource, rowKey, loading, pagination, onChange
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
      dataIndex: 'registerSource',
      render(registerSource) {
        switch (registerSource) {
          case 'performer':
            return <Tag color="cyan">Creator</Tag>;
          case 'user':
            return <Tag color="geekblue">Fan</Tag>;
          default: return <Tag color="default">{registerSource}</Tag>;
        }
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
      loading={loading}
      columns={columns}
      dataSource={dataSource}
      pagination={{ ...pagination, showSizeChanger: false }}
      onChange={onChange.bind(this)}
    />
  );
}

export default TableListReferral;
