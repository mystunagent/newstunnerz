import { PureComponent } from 'react';
import { Table, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { DropdownAction } from '@components/common/dropdown-action';
import Link from 'next/link';
import { formatDate } from '@lib/date';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
  deleteEvent: Function;
}

export class EventListTable extends PureComponent<IProps> {
  render() {
    const { deleteEvent } = this.props;

    const columns = [
      {
        title: 'Event',
        dataIndex: 'name',
        render(name) {
          return <span>{name}</span>;
        }
      },
      {
        title: 'Start At',
        dataIndex: 'startAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: 'End At',
        dataIndex: 'endAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: 'Location',
        dataIndex: 'address',
        render(address) {
          return (
            <div style={{
              whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
            }}
            >
              {address}
            </div>
          );
        }
      },
      {
        title: 'Hosted',
        dataIndex: 'hosted',
        render(hosted) {
          return (
            <div style={{
              whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
            }}
            >
              {hosted}
            </div>
          );
        }

      },
      {
        title: 'Price',
        dataIndex: 'price',
        render(price: number) {
          return (
            <span>
              $
              {price.toFixed(2)}
            </span>
          );
        }
      },
      {
        title: 'Availability',
        dataIndex: 'availability',
        render(availability) {
          return (
            <span>
              {availability}
            </span>
          );
        }
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render(status) {
          if (status === 'inactive') {
            return <Tag color="red">Inactive</Tag>;
          }
          return <Tag color="green">Active</Tag>;
        }
      },
      {
        title: 'Info',
        dataIndex: 'info',
        render(info) {
          return (
            <span>
              {info}
            </span>
          );
        }
      },
      {
        title: 'Email',
        dataIndex: 'email',
        render(email: string) {
          return (
            <span>
              {email}
            </span>
          );
        }
      },
      {
        title: 'Mobile',
        dataIndex: 'mobile',
        render(mobile) {
          return (
            <span>
              {mobile}
            </span>
          );
        }
      },
      {
        title: 'Updated On',
        dataIndex: 'updatedAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: 'Action',
        dataIndex: '_id',
        render: (id: string) => (
          <DropdownAction
            menuOptions={[
              {
                key: 'update',
                name: 'Update',
                children: (
                  <Link
                    href={{
                      pathname: '/event-list/view',
                      query: { id }
                    }}
                    as={`/event-list/view?id=${id}`}
                  >
                    <a>
                      <EyeOutlined />
                      {' '}
                      View Book
                    </a>
                  </Link>
                )
              },
              {
                key: 'update',
                name: 'Update',
                children: (
                  <Link
                    href={{
                      pathname: '/event-list/update',
                      query: { id }
                    }}
                    as={`/event-list/update?id=${id}`}
                  >
                    <a>
                      <EditOutlined />
                      {' '}
                      Update
                    </a>
                  </Link>
                )
              },
              {
                key: 'delete',
                name: 'Delete',
                children: (
                  <span>
                    <DeleteOutlined />
                    {' '}
                    Delete
                  </span>
                ),
                onClick: () => deleteEvent(id)
              }
            ]}
          />
        )
      }
    ];
    const {
      dataSource, rowKey, loading, pagination, onChange
    } = this.props;
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
  }
}
