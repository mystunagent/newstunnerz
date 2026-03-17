/* eslint-disable no-nested-ternary */
import {
  ArrowRightOutlined,
} from "@ant-design/icons";
import { getResponseError } from "@lib/utils";
import Router from "next/router";
import { PureComponent } from "react";
import moment from "moment";
import { bookingStreamService } from "@services/booking-stream";
import { Calendar, message, PageHeader, Image, Modal } from "antd";
import { formatDateNotSecond } from "@lib/date";
import Head from "next/head";
import Page from "@components/common/layout/page";
import { connect } from "react-redux";
import { upcomingStreamService } from "@services/upcoming-stream.service";
import "./index.less";

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
  openScheduleMobile: boolean;
  listDataUpcoming: any;
  listData: any;
}

class MyBookingAppointment extends PureComponent<IProps, IStates> {
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
      openScheduleMobile: false,
      listDataUpcoming: [],
      listData: []
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

  view(record) {
    Router.push(
      {
        href: "/creator/live/appointment",
        query: { conversationId: record.conversationId },
      },
      `/creator/live/appointment?conversationId=${record.conversationId}`
    );
    this.setState({ openScheduleMobile: false });
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

  viewBooking(record) {
    Router.push(
      `/creator/live/appointment?conversationId=${record?.conversationId}`
    );
    this.setState({ openScheduleMobile: false });
  }

  async reject(record) {
    try {
      if (window.confirm("Are you sure you want to reject this item?")) {
        await bookingStreamService.reject(record._id);
        this.getData();
      }
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  }

  handleRedirect = async (item) => {
    if (item?.status === "streamed" || moment() > moment(item.endAt)) {
      // no redirect
      // message.info('This time has streamed');
    } else if (moment() < moment(item?.startAt)) {
      Router.push(`/creator/live?upcomingId=${item?._id}`);
    } else if (
      moment() >= moment(item.startAt) ||
      moment() <= moment(item.endAt)
    ) {
      Router.push(`/creator/live/upcoming?upcomingId=${item?._id}`);
    }
    this.setState({ openScheduleMobile: false });
  };

  dateCellRender(date: moment.Moment) {
    const { dataUpcomingStream, dataBookingStream } =
      this.state;
    const startOfDate = moment(date).startOf("day");
    const endOfDate = moment(date).endOf("day");
    const listDataUpcoming = dataUpcomingStream.filter(
      (record) =>
        moment(record.startAt).isBefore(endOfDate) &&
        moment(record.startAt).isAfter(startOfDate)
    );
    const listData = dataBookingStream.filter(
      (record) =>
        moment(record.startAt).isBefore(endOfDate) &&
        moment(record.startAt).isAfter(startOfDate)
    );

    return (
      <>
        <ul className="custom-events-list">
          {listDataUpcoming.map((record) => (
            <li key={record._id}>
              <Image
                preview={false}
                width={18}
                src="/static/public-call-meeting.png"
              />
              <p
                onClick={() => this.handleRedirect(record)}
                aria-hidden
                className={
                  moment() >= moment(record.startAt) &&
                  moment() <= moment(record.endAt) &&
                  record.status === "pending"
                    ? "bg-red"
                    : moment() > moment(record.endAt) ||
                      record.status === "streamed"
                    ? "bg-gray"
                    : "bg-blue"
                }
              >
                {`${formatDateNotSecond(
                  record.startAt,
                  "HH:mm"
                )} - ${formatDateNotSecond(record.endAt, "HH:mm")}`}
              </p>
            </li>
          ))}
          {listData.map((record) => (
            <li key={record._id}>
              <Image
                preview={false}
                width={18}
                src="/static/private-call-meeting.png"
              />
              <p
                onClick={() => this.viewBooking(record)}
                aria-hidden
                className={
                  moment() >= moment(record.startAt) &&
                  moment() <= moment(record.endAt) &&
                  record.status === "approved"
                    ? "bg-red"
                    : moment() > moment(record.endAt) ||
                      record.status === "streamed"
                    ? "bg-gray"
                    : "bg-blue"
                }
              >
                {`${formatDateNotSecond(
                  record.startAt,
                  "HH:mm"
                )} - ${formatDateNotSecond(record.endAt, "HH:mm")}`}
              </p>
            </li>
          ))}
        </ul>
        <ul
          className="custom-events-list-mobile"
          onClick={() => this.setState({ openScheduleMobile: true, listDataUpcoming: listDataUpcoming, listData: listData })}
        >
          {listDataUpcoming.map((record) => (
            <li key={record._id}>
              <Image
                preview={false}
                width={18}
                src="/static/public-call-meeting.png"
              />
              <p
                aria-hidden
                className={
                  moment() >= moment(record.startAt) &&
                  moment() <= moment(record.endAt) &&
                  record.status === "pending"
                    ? "bg-red"
                    : moment() > moment(record.endAt) ||
                      record.status === "streamed"
                    ? "bg-gray"
                    : "bg-blue"
                }
              >
                {`${formatDateNotSecond(
                  record.startAt,
                  "HH:mm"
                )} - ${formatDateNotSecond(record.endAt, "HH:mm")}`}
              </p>
            </li>
          ))}
          {listData.map((record) => (
            <li key={record._id}>
              <Image
                preview={false}
                width={18}
                src="/static/private-call-meeting.png"
              />
              <p
                aria-hidden
                className={
                  moment() >= moment(record.startAt) &&
                  moment() <= moment(record.endAt) &&
                  record.status === "approved"
                    ? "bg-red"
                    : moment() > moment(record.endAt) ||
                      record.status === "streamed"
                    ? "bg-gray"
                    : "bg-blue"
                }
              >
                {`${formatDateNotSecond(
                  record.startAt,
                  "HH:mm"
                )} - ${formatDateNotSecond(record.endAt, "HH:mm")}`}
              </p>
            </li>
          ))}
        </ul>
      </>
    );
  }

  render() {
    const { openScheduleMobile, listData, listDataUpcoming } = this.state;

    return (
      <>
        <Head>
          <title>My Booking Stream</title>
        </Head>
        <Page className="main-container">
          <div className="title-link-booking">
            <PageHeader title="My Schedules" onBack={() => Router.back()} />
            <PageHeader
              className="title-link-back"
              backIcon={<ArrowRightOutlined />}
              title="My Private Stream Bookings"
              onBack={() => Router.push("/creator/book-stream/private")}
            />
          </div>
          <div className="title-link-booking">
            <div className="title-content">
              <p>
                <Image
                  preview={false}
                  width={18}
                  src="/static/private-call-meeting.png"
                />{" "}
                Private Streaming
              </p>
              <p>
                <Image
                  preview={false}
                  width={18}
                  src="/static/public-call-meeting.png"
                />{" "}
                Public streaming icon
              </p>
            </div>
          </div>
          <Calendar
            onPanelChange={this.onPanelChange.bind(this)}
            dateCellRender={this.dateCellRender.bind(this)}
          />
        </Page>
        <Modal
          footer={null}
          title="Scheduled"
          width={645}
          maskClosable={false}
          visible={openScheduleMobile}
          onCancel={() => this.setState({ openScheduleMobile: false })}
        >
          <ul className="custom-events-list-mobile">
            {listDataUpcoming.map((record) => (
              <li key={record._id}>
                <Image
                  preview={false}
                  width={18}
                  src="/static/public-call-meeting.png"
                />
                <p
                  onClick={() => this.handleRedirect(record)}
                  aria-hidden
                  className={
                    moment() >= moment(record.startAt) &&
                    moment() <= moment(record.endAt) &&
                    record.status === "pending"
                      ? "bg-red"
                      : moment() > moment(record.endAt) ||
                        record.status === "streamed"
                      ? "bg-gray"
                      : "bg-blue"
                  }
                >
                  {`${formatDateNotSecond(
                    record.startAt,
                    "HH:mm"
                  )} - ${formatDateNotSecond(record.endAt, "HH:mm")}`}
                </p>
              </li>
            ))}
            {listData.map((record) => (
              <li key={record._id}>
                <Image
                  preview={false}
                  width={18}
                  src="/static/private-call-meeting.png"
                />
                <p
                  onClick={() => this.viewBooking(record)}
                  aria-hidden
                  className={
                    moment() >= moment(record.startAt) &&
                    moment() <= moment(record.endAt) &&
                    record.status === "approved"
                      ? "bg-red"
                      : moment() > moment(record.endAt) ||
                        record.status === "streamed"
                      ? "bg-gray"
                      : "bg-blue"
                  }
                >
                  {`${formatDateNotSecond(
                    record.startAt,
                    "HH:mm"
                  )} - ${formatDateNotSecond(record.endAt, "HH:mm")}`}
                </p>
              </li>
            ))}
          </ul>
        </Modal>
      </>
    );
  }
}

const mapStates = (state: any) => ({
  currentUser: state.user.current,
});
const mapDispatch = {};
export default connect(mapStates, mapDispatch)(MyBookingAppointment);
