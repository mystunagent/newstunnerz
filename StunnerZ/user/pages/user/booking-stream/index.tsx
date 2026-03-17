import { ISearch } from "@interfaces/utils";
import { formatDateNotSecond } from "@lib/date";
import { getResponseError, getSearchData } from "@lib/utils";
import { bookingStreamService } from "@services/booking-stream";
import { Button, message, PageHeader } from "antd";
import Table, { ColumnType } from "antd/lib/table";
import moment from "moment";
import Router from "next/router";
import { PureComponent } from "react";
import { DeleteOutlined, PlayCircleOutlined } from "@ant-design/icons";
import Head from "next/head";
import Page from "@components/common/layout/page";
import { streamService } from "@services/index";

interface IProps {}

interface IStates {
  pagination: {
    pageSize: number;
    current: number;
    total: number;
  };
  sort: string;
  sortBy: string;
  filter: {};
  data: any;
  dataUpcomingStream: any;
  dataBookingStream: any;
  startAt: any;
  endAt: any;
  searching: boolean;
}

class BookingAppointment extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static layout = "primary";

  constructor(props: IProps) {
    super(props);
    this.state = {
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0,
      },
      sort: "desc",
      sortBy: "updatedAt",
      filter: {},
      startAt: "",
      endAt: "",
      data: [],
      dataUpcomingStream: [],
      dataBookingStream: [],
      searching: false,
    };
  }

  componentDidMount() {
    this.getData();
  }

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.getData();
  }

  async handleTabChange(data) {
    const { pagination } = this.state;
    console.log(data);
    await this.setState({
      pagination: {
        ...pagination,
        pageSize: data.pageSize,
        current: data.current,
      },
    });
    this.getData();
  }

  async onPanelChange(date: moment.Moment, mode: string) {
    if (mode === "month") {
      const startOfMonth = new Date(
        date.startOf("month").toISOString()
      ).getTime();
      const endOfMonth = new Date(date.endOf("month").toISOString()).getTime();
      this.setState({
        startAt: startOfMonth,
        endAt: endOfMonth,
      });
    }
  }

  async getData() {
    try {
      const { filter, sort, sortBy, pagination } = this.state;
      this.setState({ searching: true });
      const resp = await bookingStreamService.userSearch({
        ...filter,
        sort,
        sortBy,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
      });
      this.setState({
        data: resp.data.data,
        pagination: { ...pagination, total: resp.data.total },
      });
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      this.setState({ searching: false });
    }
  }

  async view(record) {
    const { data } = await streamService.getMemberRoomBooking(
      record.conversationId
    );
    if (data && data?.length > 0) {
      Router.push(
        `/streaming/appointment?username=${record.performerInfo?.username}&conversationId=${record.conversationId}`
      );
    } else {
      message.info(
        "The model is not in the room yet. Please try again later",
        5
      );
    }
  }

  async delete(record) {
    try {
      if (window.confirm("Are you sure you want to delete this item?")) {
        await bookingStreamService.delete(record._id);
        this.getData();
      }
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  }

  render() {
    const { data, searching, pagination } = this.state;
    const columns: ColumnType<any>[] = [
      {
        title: "Performer",
        key: "performer",
        width: 80,
        render: (record) => record.performerInfo?.username || "N/A",
      },
      {
        title: "Status",
        key: "status",
        width: 40,
        dataIndex: "status",
        render: (index, payload) => {
          const startAt = new Date(payload.startAt);
          const now = new Date();
          return moment(startAt.toISOString()).isAfter(now.toISOString()) ? (
            <span>{index}</span>
          ) : (
            <span>Expired</span>
          );
        },
      },
      // {
      //   title: 'Token',
      //   key: 'token',
      //   dataIndex: 'token'
      // },
      {
        title: "Start At",
        key: "startAt",
        width: 50,
        dataIndex: "startAt",
        render: (startedAt) => formatDateNotSecond(startedAt),
      },
      {
        title: "End At",
        key: "endAt",
        width: 50,
        dataIndex: "endAt",
        render: (endAt) => formatDateNotSecond(endAt),
      },
      {
        title: "Updated At",
        key: "updatedAt",
        width: 50,
        dataIndex: "updatedAt",
        render: (updatedAt) => formatDateNotSecond(updatedAt),
      },
      {
        title: "Actions",
        key: "action",
        width: 80,
        render: (record) => (
          <>
            {moment(new Date(record.startAt).toISOString()).isBefore(
              new Date().toISOString()
            ) &&
              moment(new Date(record.endAt).toISOString()).isAfter(
                new Date().toISOString()
              ) && (
                <>
                  {record.conversationId && (
                    <Button type="link" onClick={() => this.view(record)}>
                      <PlayCircleOutlined /> Play
                    </Button>
                  )}
                  {/* <Button type="link" onClick={() => this.delete(record)}>
                  <DeleteOutlined />
                </Button> */}
                </>
              )}
          </>
        ),
      },
    ];
    return (
      <>
        <Head>
          <title>My Booking Stream</title>
        </Head>
        <Page className="main-container">
          <PageHeader title="Booking Stream" onBack={() => Router.back()} />
          <Table
            dataSource={data}
            columns={columns}
            onChange={this.handleTabChange.bind(this)}
            loading={searching}
            pagination={{
              pageSize: pagination.pageSize,
              total: pagination.total,
            }}
            rowKey="_id"
            // scroll={{ x: 1200 }}
          />
        </Page>
      </>
    );
  }
}

export default BookingAppointment;
