import { PureComponent } from "react";
import { Table, Tag } from "antd";
import { DropdownAction } from "@components/common";
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  approve: Function;
  reject: Function;
}

export class BookEventListTable extends PureComponent<IProps> {
  render() {
    const { approve, reject } = this.props;
    const columns = [
      {
        title: "Model",
        dataIndex: "performerInfo",
        render(performerInfo) {
          return <span>{performerInfo.username || "N/A"}</span>;
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        render(status) {
          switch (status) {
            case "pending":
              return <Tag color="yellow">Pending</Tag>;
            case "approved":
              return <Tag color="green">Approved</Tag>;
            case "rejected":
              return <Tag color="red">Rejected</Tag>;
            default:
              return <Tag color="#936dc9">{status}</Tag>;
          }
        }
      },
      {
        title: 'Action',
        dataIndex: '_id',
        render: (id: string) => (
          <DropdownAction
            menuOptions={[
              {
                key: 'approve',
                name: 'approve',
                children: (
                  <span>
                    <CheckOutlined />
                    {' '}
                    Approve
                  </span>
                ),
                onClick: () => approve(id)
              },
              {
                key: 'reject',
                name: 'Reject',
                children: (
                  <span>
                    <DeleteOutlined />
                    {' '}
                    Reject
                  </span>
                ),
                onClick: () => reject(id)
              }
            ]}
          />
        )
      }
    ];
    const { dataSource, rowKey, loading } = this.props;
    return (
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        loading={loading}
      />
    );
  }
}
