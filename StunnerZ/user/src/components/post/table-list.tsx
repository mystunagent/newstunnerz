/* eslint-disable react/destructuring-assignment */
import {
  Table, Tag, Tooltip, Button
} from 'antd';
import {
  AudioOutlined, FileImageOutlined, VideoCameraOutlined, DeleteOutlined, EditOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { IFeed } from 'src/interfaces';
import { formatDateNotSecond } from 'src/lib';

interface IProps {
  feeds: IFeed[];
  searching: boolean;
  total: number;
  pageSize: number;
  onChange: Function;
  onDelete: Function;
}

const FeedList = ({
  feeds,
  searching,
  total,
  pageSize,
  onChange,
  onDelete
}: IProps) => {
  const columns = [
    {
      title: 'Post Type',
      key: 'id',
      render: (record) => {
        const images = record.files && record.files.filter((f) => f.type === 'feed-photo');
        return (
          <Link
            href={{
              pathname: '/post',
              query: {
                id: record.slug || record._id
              }
            }}
            as={`/post/${record.slug || record._id}`}
          >
            <a style={{ fontSize: 16 }}>
              {record.type === 'photo' && (
                <span>
                  {images.length || 1}
                  {' '}
                  <FileImageOutlined />
                  {' '}
                </span>
              )}
              {record.type === 'video' && (
                <span>
                  <VideoCameraOutlined />
                </span>
              )}
              {record.type === 'audio' && (
                <span>
                  <AudioOutlined />
                </span>
              )}
              {record.type === 'text' && (
                <span>
                  Aa
                </span>
              )}
            </a>
          </Link>
        );
      }
    },
    {
      title: 'Description',
      dataIndex: 'text',
      key: 'text',
      render: (text: string) => (
        <Tooltip title={text}>
          <div style={{
            width: 150, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
          }}
          >
            {text}
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Schedule',
      dataIndex: 'isSchedule',
      key: 'isSchedule',
      render: (isSchedule: boolean) => {
        switch (isSchedule) {
          case true:
            return <Tag color="green">Y</Tag>;
          case false:
            return <Tag color="red">N</Tag>;
          default: return <Tag color="blue">{isSchedule}</Tag>;
        }
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        switch (status) {
          case 'active':
            return <Tag color="green">Active</Tag>;
          case 'inactive':
            return <Tag color="orange">Inactive</Tag>;
          default: return <Tag color="blue">{status}</Tag>;
        }
      }
    },
    {
      title: 'Schedule On',
      key: 'scheduleFrom',
      dataIndex: 'scheduleFrom',
      render: (scheduleFrom, record) => <span>{formatDateNotSecond(scheduleFrom || record?.updatedAt) || 'N/A'}</span>
    },
    {
      title: 'Schedule Off',
      key: 'scheduleTo',
      dataIndex: 'scheduleTo',
      render: (scheduleTo: Date) => (
        <span>
          {scheduleTo && formatDateNotSecond(scheduleTo) || 'N/A' }
        </span>
      )
    },
    {
      title: 'Updated On',
      key: 'updatedAt',
      dataIndex: 'updatedAt',
      render: (updatedAt: Date) => <span>{formatDateNotSecond(updatedAt)}</span>
    },
    {
      title: 'Action',
      key: 'details',
      render: (record) => [
        <Button className="info" key="edit">
          <Link
            key="edit"
            href={{ pathname: '/creator/my-post/edit', query: { id: record._id } }}
          >
            <a>
              <EditOutlined />
            </a>
          </Link>
        </Button>,
        <Button
          key="status"
          className="danger"
          onClick={() => onDelete(record)}
        >
          <DeleteOutlined />
        </Button>
      ]
    }
  ];
  const dataSource = feeds.map((p) => ({ ...p, key: p._id }));

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      className="table"
      pagination={{
        total,
        pageSize
      }}
      rowKey="_id"
      showSorterTooltip={false}
      loading={searching}
      onChange={onChange.bind(this)}
    />
  );
};
FeedList.defaultProps = {};
export default FeedList;
