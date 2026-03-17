import BarTitleHome from "@components/common/base/bar-title-home";
import { IPerformer } from "@interfaces/performer";
import { earningService } from "@services/earning.service";
import {
  Card,
  Col,
  Layout,
  Menu,
  MenuProps,
  message,
  Row,
  Statistic,
  Image,
} from "antd";
import Head from "next/head";
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import "./index.less";
import {
  bookingStreamService,
  messageService,
  subAccountService,
} from "@services/index";
import { eventService } from "@services/events.service";
import Link from "next/link";
import { formatDateNotSecond } from "@lib/date";
import { upcomingStreamService } from "@services/upcoming-stream.service";
import Router from "next/router";

type IProps = {
  ui: any;
  user: IPerformer;
};
function DashboardModel({ ui, user }: IProps) {
  const [stats, setStats] = useState<Record<string, any>>();
  const [countMess, setCountMess] = useState<Record<string, any>>();
  const [upcomingStream, setUpcomingStream] = useState<Record<string, any>>([]);
  const [bookingStream, setBookingStream] = useState<Record<string, any>>([]);
  const [event, setEvent] = useState<Record<string, any>>();
  const [subAccount, setSubAccount] = useState<string>();
  const [menuMode, setMenuMode] = useState([""]);

  const loadStats = async () => {
    try {
      const { data } = await earningService.performerStats();
      setStats(data);
    } catch (error) {
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  const handleCountNotReadMess = async () => {
    try {
      const { data } = await messageService.countTotalNotRead();
      setCountMess(data);
    } catch (error) {
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  const handleLoadUpcomingStream = async () => {
    try {
      const { data } = await upcomingStreamService.performerSearch({
        limit: 10,
        offset: 0,
        sort: "desc",
      });
      setUpcomingStream(data);
    } catch (error) {
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  const handleLoadBookingStream = async () => {
    try {
      const { data } = await bookingStreamService.performerSearch({
        limit: 10,
        offset: 0,
        sort: "desc",
        status: "approved",
      });
      setBookingStream(data);
    } catch (error) {
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  const handleLoadEvent = async () => {
    try {
      const { data } = await eventService.searchBookEvent({
        limit: 10,
        offset: 0,
        status: "approved",
      });
      setEvent(data);
    } catch (error) {
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  const rootSubmenuKeys = ["sub1"];

  const onOpenChange: MenuProps["onOpenChange"] = (keys: any) => {
    const latestOpenKey = keys.find((key: any) => menuMode.indexOf(key) === -1);
    if (rootSubmenuKeys.indexOf(latestOpenKey?.toString()!) === -1) {
      setMenuMode(keys);
    } else {
      setMenuMode(latestOpenKey ? [latestOpenKey?.toString()] : []);
    }
  };

  const getNameSubAccount = async () => {
    try {
      const { data } = await subAccountService.getNameSubAccount();
      setSubAccount(data);
    } catch (error) {
      const e = await error;
      message.error(e.message || "An occurred error");
    }
  };

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 768) {
        setMenuMode([""]);
      } else {
        setMenuMode(["sub1"]);
      }
    }

    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial mode

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (user?.infoSubPerformer?._id) {
      Router.push("/");
      return;
    }
    loadStats();
    handleCountNotReadMess();
    handleLoadUpcomingStream();
    handleLoadBookingStream();
    handleLoadEvent();
    getNameSubAccount();
  }, []);

  // useEffect(() => {
  //   if (user) {
  //     if (user.accountManager === "stunnerZ-managed") {
  //       setSubAccount("StunnerZ Managed");
  //       return;
  //     }
  //     if (user.accountManager === "agency-managed") {
  //       setSubAccount(user?.nameSubPerformer?.username || "Agency Managed");
  //       return;
  //     }
  //     setSubAccount("Self Managed");
  //   }
  // }, []);

  const upcomingOn24Hours =
    upcomingStream &&
    upcomingStream?.data?.filter(
      (u) => new Date(u.startAt).getDate() >= new Date().getDate()
    )?.length > 0 &&
    upcomingStream.data
      ?.filter((u) => {
        const now = new Date();
        const startAt = new Date(u.startAt);
        const diffInHours =
          (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffInHours >= 0 && diffInHours <= 24; // while 24 hours
      })
      ?.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );

  const bookingOn2hHours =
    bookingStream &&
    bookingStream?.data?.filter(
      (u) => new Date(u.startAt).getDate() >= new Date().getDate()
    )?.length > 0 &&
    bookingStream.data
      ?.filter((u) => {
        const now = new Date();
        const startAt = new Date(u.startAt);
        const diffInHours =
          (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffInHours >= 0 && diffInHours <= 24; // while 24 hours
      })
      ?.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );

  return (
    <Layout>
      <Head>
        <title>{ui && ui.siteName} | Dashboard</title>
      </Head>
      <div className="main-container">
        <BarTitleHome title="Stats" />
        <Row>
          <Col xs={12} md={8} lg={4}>
            <Card className="border-card-dashboard">
              <Link href="/creator/my-subscriber">
                <a>
                  <Statistic
                    title="My Subscribers"
                    value={user.stats?.subscribers}
                  />
                </a>
              </Link>
            </Card>
          </Col>
          <Col xs={0} md={0} lg={1} />
          <Col xs={12} md={8} lg={4}>
            <Card className="border-card-dashboard">
              <Link href="/creator/referral">
                <a>
                  <Statistic
                    title="Referral"
                    value={user.referrerInfo?.length}
                  />
                </a>
              </Link>
            </Card>
          </Col>
          <Col xs={0} md={0} lg={1} />
          <Col xs={12} md={8} lg={4}>
            <Card className="border-card-dashboard">
              <Link href="/creator/earning">
                <a>
                  <Statistic
                    title="My Earnings"
                    prefix="$"
                    value={stats && Number(stats?.totalNetPrice).toFixed(2)}
                  />
                </a>
              </Link>
            </Card>
          </Col>
          <Col xs={0} md={0} lg={1} />
          <Col xs={12} md={8} lg={4}>
            <Card className="border-card-dashboard">
              <Link href="/creator/earning">
                <a>
                  <Statistic
                    title="Total Unpaid"
                    prefix="$"
                    value={stats && Number(stats?.totalUnpaidAmount).toFixed(2)}
                  />
                </a>
              </Link>
            </Card>
          </Col>
          <Col xs={0} md={0} lg={1} />
          <Col xs={12} md={8} lg={4}>
            <Card className="border-card-dashboard">
              <Link href="/creator/earning">
                <a>
                  <Statistic
                    title="Total Paid"
                    prefix="$"
                    value={stats && Number(stats?.totalPaidAmount).toFixed(2)}
                  />
                </a>
              </Link>
            </Card>
          </Col>
        </Row>
      </div>
      <BarTitleHome title="" />
      <div>
        <Row>
          <Col xs={24} md={8} lg={4}>
            <Menu mode="inline" onOpenChange={onOpenChange} openKeys={menuMode}>
              <Menu.SubMenu key="sub1" title="Select Options">
                <Menu.Item>
                  <Link href="/creator/account">
                    <a>Update Profile</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href={`${user.username}`}>
                    <a>Preview Profile</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/banking">
                    <a>Update Banking</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/block-user">
                    <a>Blacklist</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/block-countries">
                    <a>Block Countries</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/welcome-message">
                    <a>Welcome Message</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/account/price-setting">
                    <a>Pricing</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/referral">
                    <a>Referral</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/my-post">
                    <a>My Posts</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/my-video">
                    <a>My Videos</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/my-gallery">
                    <a>My Gallery</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/my-store">
                    <a>My Products</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/my-order">
                    <a>My Orders</a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/creator/earning">
                    <a>Earning History</a>
                  </Link>
                </Menu.Item>
              </Menu.SubMenu>
            </Menu>
          </Col>
          <Col xs={24} md={16} lg={20}>
            <div className="dashboard-schedule-items">
              <Row>
                <Col xs={24} md={12} lg={8}>
                  <Link href="/creator/my-post">
                    <a>
                      <Card>
                        <Statistic
                          title="My Posts"
                          value={user.stats?.totalFeeds}
                        />
                      </Card>
                    </a>
                  </Link>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Link href="/creator/book-stream">
                    <a>
                      <Card className="dashboard-card-event">
                        <Statistic
                          className="dashboard-card-event-hidden"
                          title="Stream Scheduled for next 24 hours"
                          value=" "
                        />
                        {upcomingOn24Hours &&
                          upcomingOn24Hours.map((item) => (
                            <div
                              style={{
                                color: "#000",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Image
                                preview={false}
                                width={20}
                                src="/static/public-call-meeting.png"
                              />
                              <span style={{ marginLeft: "10px" }}>
                                {`${formatDateNotSecond(
                                  item.startAt
                                )} - ${formatDateNotSecond(item.endAt)}`}
                              </span>
                            </div>
                          ))}
                        {bookingOn2hHours &&
                          bookingOn2hHours.map((item) => (
                            <div
                              style={{
                                color: "#000",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Image
                                preview={false}
                                width={20}
                                src="/static/private-call-meeting.png"
                              />
                              <span style={{ marginLeft: "10px" }}>
                                {`${formatDateNotSecond(
                                  item.startAt
                                )} - ${formatDateNotSecond(item.endAt)}`}
                              </span>
                            </div>
                          ))}
                        {(upcomingOn24Hours?.length <= 0 ||
                          !upcomingOn24Hours) &&
                          (bookingOn2hHours?.length <= 0 ||
                            !bookingOn2hHours) && (
                            <div style={{ color: "#000" }}>Not Schedule</div>
                          )}
                      </Card>
                    </a>
                  </Link>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Link href="/sexting">
                    <a>
                      <Card>
                        <Statistic
                          title="Sexting"
                          value={
                            countMess && Number(countMess?.total).toFixed(0)
                          }
                        />
                      </Card>
                    </a>
                  </Link>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Link href="/creator/events">
                    <a>
                      <Card className="dashboard-card-event">
                        <Statistic
                          className="dashboard-card-event-hidden"
                          title="Events"
                          value=" "
                        />
                        {event &&
                        event?.data?.filter(
                          (u) => new Date(u?.eventInfo?.startAt) >= new Date()
                        )?.length > 0 ? (
                          event.data
                            ?.filter(
                              (u) =>
                                new Date(u?.eventInfo?.startAt) >= new Date()
                            )
                            .map((item) => (
                              <div style={{ color: "#000" }}>
                                {`${formatDateNotSecond(
                                  item?.eventInfo?.startAt
                                )} - ${formatDateNotSecond(
                                  item?.eventInfo?.endAt
                                )}`}{" "}
                                - {item?.eventInfo?.name}
                              </div>
                            ))
                        ) : (
                          <div style={{ color: "#000" }}>Not Schedule</div>
                        )}
                      </Card>
                    </a>
                  </Link>
                </Col>
                {/* <Col xs={24} md={12} lg={8}>
                  <Card>
                    <Link href="#">
                      <a>
                        <Statistic title="Join StripVR" value="(joined/Not Joined)" />
                      </a>
                    </Link>
                    <Statistic title=" " value=" " />
                  </Card>
                </Col> */}
                <Col xs={24} md={12} lg={8}>
                  <Link href="/creator/account/manager">
                    <a>
                      <Card>
                        <Statistic title="Account manager" value={subAccount} />
                      </Card>
                    </a>
                  </Link>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </div>
    </Layout>
  );
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  user: { ...state.user.current },
});
DashboardModel.authenticate = true;
DashboardModel.onlyPerformer = true;
const mapDispatch = {};
export default connect(mapStates, mapDispatch)(DashboardModel);
