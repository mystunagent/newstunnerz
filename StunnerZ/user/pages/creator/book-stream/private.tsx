/* eslint-disable no-nested-ternary */
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { getResponseError } from "@lib/utils";
import Router from "next/router";
import { PureComponent } from "react";
import moment from "moment";
import { bookingStreamService } from "@services/booking-stream";
import { Button, message, PageHeader } from "antd";
import { formatDateNotSecond } from "@lib/date";
import Table, { ColumnType } from "antd/lib/table";
import Head from "next/head";
import Page from "@components/common/layout/page";
import { connect } from "react-redux";
import { upcomingStreamService } from "@services/upcoming-stream.service";
import "./index.less";
import { streamService } from "@services/stream.service";

interface IProps {
  currentUser: any;
}

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

class MyPrivateBookStreamPage extends PureComponent<IProps, IStates> {
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
    const { currentUser } = this.props;
    if (
      currentUser?.infoSubPerformer?._id &&
      !currentUser?.infoBankSubPerformer
    ) {
      Router.push("/");
      return;
    }
    if (
      currentUser?.infoSubPerformer?._id &&
      !currentUser?.infoSubPerformer?.privilege.includes("all") &&
      !currentUser?.infoSubPerformer?.privilege.includes("booking_stream")
    ) {
      Router.push("/");
      return;
    }
    this.getData();
    this.getDataUpcomingStream();
    this.getDataBookStream();
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
      const resp = await bookingStreamService.performerSearch({
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

  async getDataBookStream() {
    try {
      const resp = await bookingStreamService.performerSearch({
        limit: 10,
        offset: 0,
        sortBy: "createdAt",
        sort: "desc",
        status: "approved",
      });
      this.setState({ dataBookingStream: resp.data.data });
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      this.setState({ searching: false });
    }
  }

  async getDataUpcomingStream() {
    try {
      const { data } = await upcomingStreamService.performerSearch({
        limit: 10,
        offset: 0,
      });
      this.setState({ dataUpcomingStream: data.data });
    } catch (error) {
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  }

  async view(record) {
    // window.location.href = `/creator/live/appointment?conversationId=${record.conversationId}`;
    Router.push(
      `/creator/live/appointment?conversationId=${record.conversationId}`
    );
  }

  async approve(record) {
    try {
      if (window.confirm("Are you sure you want to approve this item?")) {
        await bookingStreamService.approve(record._id);
        this.getData();
      }
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  }

  async reject(record) {
    try {
      if (window.confirm("Are you sure you want to rejcet this item?")) {
        await bookingStreamService.reject(record._id);
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
        title: "User",
        key: "user",
        width: 150,
        render: (record) => record.userInfo?.username || "N/A",
      },
      {
        title: "Status",
        key: "status",
        width: 120,
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
      {
        title: "Price",
        key: "token",
        width: 120,
        dataIndex: "token",
      },
      {
        title: "Start At",
        key: "startAt",
        width: 130,
        dataIndex: "startAt",
        render: (startedAt) => formatDateNotSecond(startedAt),
      },
      {
        title: "End At",
        width: 130,
        key: "endAt",
        dataIndex: "endAt",
        render: (endAt) => formatDateNotSecond(endAt),
      },
      {
        title: "Updated At",
        key: "updatedAt",
        width: 130,
        dataIndex: "updatedAt",
        render: (updatedAt) => formatDateNotSecond(updatedAt),
      },
      {
        title: "Actions",
        key: "action",
        render: (record) => (
          <>
            {moment(new Date(record.endAt).toISOString()).isAfter(
              new Date().toISOString()
            ) && (
              <>
                {record.status === "pending" && (
                  <>
                    <Button
                      type="link"
                      icon={<CheckCircleOutlined />}
                      onClick={() => this.approve(record)}
                    >
                      Approve
                    </Button>
                    <Button
                      type="link"
                      icon={<CloseCircleOutlined />}
                      onClick={() => this.reject(record)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {record.conversationId &&
                  record.status === "approved" &&
                  moment(new Date(record.startAt).toISOString()).isBefore(
                    new Date().toISOString()
                  ) &&
                  moment(new Date(record.endAt).toISOString()).isAfter(
                    new Date().toISOString()
                  ) && (
                    <Button
                      type="link"
                      onClick={() => this.view(record)}
                      icon={<PlayCircleOutlined />}
                    >
                      Play
                    </Button>
                  )}
              </>
            )}
          </>
        ),
      },
    ];

    return (
      <>
        <Head>
          <title>My Private Stream Bookings</title>
        </Head>
        <Page className="main-container">
          <PageHeader
            title="My Private Stream Bookings"
            onBack={() => Router.back()}
          />
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
          />
        </Page>
      </>
    );
  }
}

const mapStates = (state: any) => ({
  currentUser: state.user.current,
});
const mapDispatch = {};
export default connect(mapStates, mapDispatch)(MyPrivateBookStreamPage);
