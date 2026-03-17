import { Table, Tag, Button, Avatar } from "antd";
import { ISubscription } from "src/interfaces";
import { formatDateNotSecond, nowIsBefore } from "@lib/date";
import Link from "next/link";

interface IProps {
  dataSource: ISubscription[];
  pagination: any;
  rowKey: string;
  onChange: any;
  loading: boolean;
  cancelSubscription: Function;
  activeSubscription: Function;
}

export const TableListSubscription = ({
  dataSource,
  pagination,
  rowKey,
  onChange,
  loading,
  cancelSubscription,
  activeSubscription,
}: IProps) => {
  const columns = [
    {
      title: "Creator",
      dataIndex: "performerInfo",
      render(data, records: ISubscription) {
        return (
          <Link
            href={{
              pathname: "/creator/profile",
              query: {
                username:
                  records?.performerInfo?.username ||
                  records?.performerInfo?._id,
              },
            }}
            as={`/${
              records?.performerInfo?.username || records?.performerInfo?._id
            }`}
          >
            <a>
              <Avatar
                src={records?.performerInfo?.avatar || "/static/no-avatar.png"}
              />{" "}
              {records?.performerInfo?.name ||
                records?.performerInfo?.username ||
                "N/A"}
            </a>
          </Link>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "subscriptionType",
      render(subscriptionType: string) {
        switch (subscriptionType) {
          case "monthly":
            return <Tag color="blue">Monthly Subscription</Tag>;
          case "six_month":
            return <Tag color="green">Six Months Subscription</Tag>;
          case "one_time":
            return <Tag color="purple">One Time Subscription</Tag>;
          case "trial":
            return <Tag color="orange">Trial Subscription</Tag>;
          case "free":
            return <Tag color="orange">Free</Tag>;
          default:
            return <Tag color="orange">{subscriptionType}</Tag>;
        }
      },
    },
    {
      title: "Start Date",
      dataIndex: "createdAt",
      sorter: true,
      render(date: Date) {
        return <span>{formatDateNotSecond(date, "ll")}</span>;
      },
    },
    {
      title: "Expiry Date",
      dataIndex: "expiredAt",
      sorter: true,
      render(date: Date, record) {
        if (record.subscriptionType === "one_time") {
          return <span>N/A</span>;
        }
        return (
          <span>
            {/* {record.status === "active" && formatDateNotSecond(date, "ll")} */}
            {formatDateNotSecond(date, "ll")}
          </span>
        );
      },
    },
    {
      title: "Renewal Date",
      dataIndex: "nextRecurringDate",
      sorter: true,
      render(date: Date, record) {
        if (record.subscriptionType === "one_time") {
          return <span>N/A</span>;
        }
        return (
          <span>
            {record.status === "active" && formatDateNotSecond(date, "ll")}
          </span>
        );
      },
    },
    {
      title: "Updated on",
      dataIndex: "updatedAt",
      sorter: true,
      render(date: Date) {
        return <span>{formatDateNotSecond(date)}</span>;
      },
    },
    {
      title: "PM Gateway",
      dataIndex: "paymentGateway",
      render(paymentGateway: string) {
        switch (paymentGateway) {
          case "verotel":
            return <Tag color="blue">Verotel</Tag>;
          default:
            return <Tag color="default">{paymentGateway}</Tag>;
        }
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render(status: string, record: ISubscription) {
        if (!nowIsBefore(record.expiredAt)) {
          return <Tag color="red">Suspended</Tag>;
        }
        switch (status) {
          case "active":
            return <Tag color="success">Active</Tag>;
          case "deactivated":
            return <Tag color="red">Inactive</Tag>;
          default:
            return <Tag color="default">{status}</Tag>;
        }
      },
    },
    {
      title: "Action",
      dataIndex: "_id",
      render(_id, record: ISubscription) {
        return (
          <>
            {record.status === "active" && nowIsBefore(record.expiredAt) ? (
              <Button danger onClick={() => cancelSubscription(record)}>
                Cancel
              </Button>
            ) : (
              <>
                {record.subscriptionType !== "free" && (
                  <Button
                    type="primary"
                    onClick={() => activeSubscription(record)}
                  >
                    Activate
                  </Button>
                )}
              </>
            )}
          </>
        );
      },
    },
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
