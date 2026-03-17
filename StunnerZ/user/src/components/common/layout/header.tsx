import { PureComponent } from "react";
import { Layout, Badge, Drawer, Divider, Avatar, Button, message } from "antd";
import { connect } from "react-redux";
import Link from "next/link";
import { IUser, StreamSettings, IUIConfig, ISettings } from "src/interfaces";
import { logout } from "@redux/auth/actions";
import {
  ShoppingCartOutlined,
  UserOutlined,
  HistoryOutlined,
  NotificationOutlined,
  VideoCameraOutlined,
  FireOutlined,
  BookOutlined,
  DollarOutlined,
  PictureOutlined,
  StarOutlined,
  ShoppingOutlined,
  LogoutOutlined,
  HeartOutlined,
  BlockOutlined,
  PlusCircleOutlined,
  StopOutlined,
  BankOutlined,
  GiftOutlined,
  MessageOutlined,
  MenuOutlined,
  CloseOutlined,
  DribbbleOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import {
  HomeIcon,
  ModelIcon,
  PlusIcon,
  MessageIcon,
  LiveIcon,
  TickIcon,
  WalletSvg,
} from "src/icons";
import Router, { withRouter, Router as RouterEvent } from "next/router";
import { messageService, authService } from "src/services";
import { Event, SocketContext } from "src/socket";
import {
  addPrivateRequest,
  accessPrivateRequest,
} from "@redux/streaming/actions";
import { updateUIValue } from "src/redux/ui/actions";
import { updateBalance } from "@redux/user/actions";
import { shortenLargeNumber } from "@lib/number";
import { SubscribePerformerModal } from "src/components/subscription/subscribe-performer-modal";
import "./header.less";
import { getFeeds } from "@redux/feed/actions";
import SearchBarModel from "@components/search/input-search-model";
import classNames from "classnames";
import NotificationBankingSubPerformer from "@components/performer/notify-banking-sub-performer/notify-banking-sub-performer";
import AdvertiseForm from "../base/advertise";
import BtnHeaderLogin from "./btn-login-header";

interface IProps {
  config: ISettings;
  updateBalance: Function;
  updateUIValue: Function;
  user: IUser;
  logout: Function;
  router: any;
  getFeeds: Function;
  ui: IUIConfig;
  privateRequests: any;
  addPrivateRequest: Function;
  accessPrivateRequest: Function;
  settings: StreamSettings;
  privileges: any;
}

class Header extends PureComponent<IProps> {
  state = {
    // itemPerPage: 12,
    // orientation: '',
    // feedPage: 0,
    // keyword: '',
    totalNotReadMessage: 0,
    openProfile: false,
    opeMenu: false,
    hiddenComponent: false,
  };

  componentDidMount() {
    RouterEvent.events.on("routeChangeStart", this.handleChangeRoute);
    // this.getFeeds();
    const { user } = this.props;
    if (user._id) {
      this.handleCountNotificationMessage();
    }
  }

  componentDidUpdate(prevProps: any) {
    const { user } = this.props;
    const socket = this.context;
    if (user._id && prevProps.user._id !== user._id) {
      this.handleCountNotificationMessage();
    }
    if (socket) {
      this.handleShowMessUpcomingStream(socket);
      this.handleShowMessBookingStream(socket);
      socket.on("performer_login", (token) => {
        let local;
        setTimeout(() => {
          local = authService.getToken();
          if (token) {
            if (token === local) {
              window.location.reload();
            }
          }
        }, 2000);
      });
      socket.on("user_login", (token) => {
        if (token) {
          let local;
          setTimeout(() => {
            local = authService.getToken();
            if (token) {
              if (token === local) {
                window.location.reload();
              }
            }
          }, 2000);
        }
      });
    }
  }

  componentWillUnmount() {
    RouterEvent.events.off("routeChangeStart", this.handleChangeRoute);
    // const token = authService.getToken();
    // const socket = this.context;
    // token && socket && socket.emit('auth/logout', { token });
  }

  handleChangeRoute = () => {
    this.setState({
      openProfile: false,
    });
  };

  handleShowMessUpcomingStream(socket) {
    const { user } = this.props;
    socket.on("schedule_upcoming_stream", (data) => {
      const startAt = new Date(data?.startAt);
      const now = new Date();
      const minutes = Math.ceil((startAt.getTime() - now.getTime()) / 60000);
      if (user && user.isPerformer) {
        message.info({
          content: `Your next stream is about to commence in ${minutes} minutes`,
          duration: 15,
          key: "model_upcoming_stream",
          onClick: () => (window.location.href = "/creator/live"),
        });
      } else {
        message.info({
          content: `${
            data?.performerInfo?.name || data?.performerInfo?.username
          } is about to start streaming in ${minutes} minutes`,
          duration: 15,
          key: "user_upcoming_stream",
          onClick: () =>
            (window.location.href = `/${data?.performerInfo?.username}`),
        });
      }
    });
  }

  handleShowMessBookingStream(socket) {
    const { user } = this.props;
    socket.on("schedule_booking_stream", (data) => {
      const startAt = new Date(data?.startAt);
      const now = new Date();
      const minutes = Math.ceil((startAt.getTime() - now.getTime()) / 60000);
      if (user && user.isPerformer) {
        message.info({
          content: `Private stream with ${
            data?.userInfo?.name || data?.userInfo?.username
          } is about to commence in the next ${minutes} minutes`,
          duration: 15,
          key: "model_booking_stream",
          onClick: () => (window.location.href = "/creator/live"),
        });
      } else {
        message.info({
          content: `Private stream with ${
            data?.performerInfo?.name || data?.performerInfo?.username
          } is about to commence in the next ${minutes} minutes`,
          duration: 15,
          key: "user_booking_stream",
          onClick: () =>
            (window.location.href = `/${data?.performerInfo?.username}`),
        });
      }
    });
  }

  handleMessage = async (event) => {
    event && this.setState({ totalNotReadMessage: event.total });
  };

  handleSubscribe = (username) => {
    Router.push(
      { pathname: "/streaming/details", query: { username } },
      `/streaming/${username}`
    );
  };

  async handleCountNotificationMessage() {
    const data = await (await messageService.countTotalNotRead()).data;
    if (data) {
      this.setState({ totalNotReadMessage: data.total });
    }
  }

  async handleUpdateBalance(event) {
    const { user, updateBalance: handleUpdateBalance } = this.props;
    if (user.isPerformer) {
      handleUpdateBalance({ token: event.token });
    }
  }

  async handlePaymentStatusCallback({ redirectUrl }) {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  async handleAutoReload() {
    window.location.reload();
  }

  // async onFilterFeed(value: string) {
  //   await this.setState({ orientation: value, feedPage: 0 });
  //   this.getFeeds();
  // }

  // onSearchFeed = debounce(async (e) => {
  //   await this.setState({ keyword: e, feedPage: 0 });
  //   this.getFeeds();
  // }, 600)

  // async getFeeds() {
  //   const { getFeeds: handleGetFeeds, user } = this.props;
  //   const {
  //     itemPerPage, feedPage, keyword, orientation
  //   } = this.state;
  //   handleGetFeeds({
  //     q: keyword,
  //     orientation,
  //     limit: itemPerPage,
  //     offset: itemPerPage * feedPage,
  //     isHome: !!user.verifiedEmail
  //   });
  // }

  async beforeLogout() {
    const { logout: handleLogout, user } = this.props;
    const token = authService.getToken();
    const socket = this.context;
    token &&
      socket &&
      (await socket.emit("auth/logout", {
        token,
      }));
    await authService.logout({ id: user?._id });
    handleLogout();
  }

  render() {
    const { user, router, ui, settings, config, privileges = [] } = this.props;
    const { totalNotReadMessage, openProfile, opeMenu, hiddenComponent } =
      this.state;

    return (
      <Layout.Header
        className={classNames({
          showads: config?.advertiseContent && !hiddenComponent,
        })}
      >
        <div className={classNames("main-header")}>
          <Event
            event="nofify_read_messages_in_conversation"
            handler={this.handleMessage.bind(this)}
          />
          <Event
            event="update_balance"
            handler={this.handleUpdateBalance.bind(this)}
          />
          <Event
            event="payment_status_callback"
            handler={this.handlePaymentStatusCallback.bind(this)}
          />
          <Event
            event="model/logout"
            handler={this.handleAutoReload.bind(this)}
          />
          <Event
            event="user/logout"
            handler={this.handleAutoReload.bind(this)}
          />
          {/* <Event
            event="performer_login"
            handler={this.handleCheckTokenAutoReload.bind(this)}
          />
          <Event
            event="user_login"
            handler={this.handleCheckTokenAutoReload.bind(this)}
          /> */}
          {/* Advertise */}
          {config?.advertiseContent && (
            <AdvertiseForm
              hiddenComponent={hiddenComponent}
              onclose={() =>
                this.setState({ hiddenComponent: !hiddenComponent })
              }
            />
          )}
          <div className="main-container-header">
            <Layout.Header className="header" id="layoutHeader">
              <div className="left-bar">
                <div
                  className="toogle-menu"
                  aria-hidden
                  onClick={() => this.setState({ opeMenu: !opeMenu })}
                >
                  {!opeMenu ? <MenuOutlined /> : <CloseOutlined />}
                </div>
                <div key="logo" className="logo-nav">
                  <a onClick={() => (window.location.href = "/")}>
                    {ui.logo ? (
                      // <img src={ui.logo} alt="logo" />
                      <img src="/static/logo.png" alt="logo" />
                    ) : (
                      `${ui.siteName}`
                    )}
                  </a>
                </div>
              </div>
              <div className="nav-bar">
                <ul
                  className={classNames(
                    user._id ? "nav-icons" : "nav-icons custom",
                    { show: opeMenu },
                    { showads: config?.advertiseContent && !hiddenComponent }
                  )}
                >
                  {!user.isPerformer && (
                    <li className={router.pathname === "/" ? "active" : ""}>
                      <Link href="/">
                        <a
                          onClick={() => this.setState({ opeMenu: false })}
                          aria-hidden
                        >
                          <HomeIcon /> <span className="title">Home</span>
                        </a>
                      </Link>
                    </li>
                  )}
                  {user._id &&
                    user.isPerformer &&
                    !user?.infoSubPerformer?._id && (
                      <li
                        className={
                          router.pathname === "/dashboard" ? "active" : ""
                        }
                      >
                        <Link href="/dashboard">
                          <a
                            onClick={() => this.setState({ opeMenu: false })}
                            aria-hidden
                          >
                            <HomeIcon />{" "}
                            <span className="title">Dashboard</span>
                          </a>
                        </Link>
                      </li>
                    )}
                  {user._id && (
                    <>
                      {user?.isPerformer &&
                        privileges &&
                        (privileges?.includes("all") ||
                          privileges?.includes("posting")) && (
                          <li
                            className={
                              router.pathname === "/creator/my-post/create"
                                ? "active"
                                : ""
                            }
                          >
                            <Link href="/creator/my-post/create">
                              <a
                                onClick={() =>
                                  this.setState({ opeMenu: false })
                                }
                                aria-hidden
                              >
                                <PlusIcon />{" "}
                                <span className="title">Posting</span>
                              </a>
                            </Link>
                          </li>
                        )}
                    </>
                  )}
                  {user._id && (
                    <>
                      {user?.isPerformer &&
                        privileges &&
                        (privileges?.includes("all") ||
                          privileges?.includes("streaming")) && (
                          <li
                            className={
                              router.pathname === "/creator/live"
                                ? "active"
                                : ""
                            }
                          >
                            <Link href="/creator/live">
                              <a
                                onClick={() =>
                                  this.setState({ opeMenu: false })
                                }
                                aria-hidden
                              >
                                <LiveIcon />{" "}
                                <span className="title">Live Stream</span>
                              </a>
                            </Link>
                          </li>
                        )}
                    </>
                  )}
                  {user._id && !user.isPerformer && (
                    <li
                      key="creator"
                      className={router.pathname === "/creator" ? "active" : ""}
                    >
                      <Link href="/creator">
                        <a
                          onClick={() => this.setState({ opeMenu: false })}
                          aria-hidden
                        >
                          <ModelIcon /> <span className="title">Creators</span>
                        </a>
                      </Link>
                    </li>
                  )}
                  {user._id && !user.isPerformer && (
                    <li
                      className={router.pathname === "/posts" ? "active" : ""}
                    >
                      <Link href="/posts">
                        <a
                          onClick={() => this.setState({ opeMenu: false })}
                          aria-hidden
                        >
                          <PictureOutlined />{" "}
                          <span className="title">Posts</span>
                        </a>
                      </Link>
                    </li>
                  )}
                  {user._id &&
                    user.isPerformer &&
                    privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("messages")) && (
                      <li
                        key="messenger"
                        className={
                          router.pathname === "/sexting" ? "active" : ""
                        }
                      >
                        <Link href="/sexting">
                          <a
                            onClick={() => this.setState({ opeMenu: false })}
                            aria-hidden
                          >
                            <MessageIcon />
                            <Badge
                              className="cart-total"
                              count={totalNotReadMessage}
                              showZero
                            />{" "}
                            <span className="title" style={{ marginLeft: 6 }}>
                              Sexting
                            </span>
                          </a>
                        </Link>
                      </li>
                    )}
                  {user._id && !user.isPerformer && (
                    <li
                      key="messenger"
                      className={router.pathname === "/sexting" ? "active" : ""}
                    >
                      <Link href="/sexting">
                        <a
                          onClick={() => this.setState({ opeMenu: false })}
                          aria-hidden
                        >
                          <MessageIcon />
                          <Badge
                            className="cart-total"
                            count={totalNotReadMessage}
                            showZero
                          />{" "}
                          <span className="title" style={{ marginLeft: 6 }}>
                            Sexting
                          </span>
                        </a>
                      </Link>
                    </li>
                  )}
                  {user._id && !user.isPerformer && (
                    <li
                      key="all-live"
                      className={
                        router.pathname === "/creator/all-live" ? "active" : ""
                      }
                    >
                      <Link href="/creator/all-live">
                        <a
                          onClick={() => this.setState({ opeMenu: false })}
                          aria-hidden
                        >
                          <LiveIcon /> Live
                        </a>
                      </Link>
                    </li>
                  )}

                  {!user._id && (
                    <>
                      <li
                        key="creator"
                        className={
                          router.pathname === "/creator" ? "active" : ""
                        }
                      >
                        <Link href="/creator">
                          <a
                            onClick={() => this.setState({ opeMenu: false })}
                            aria-hidden
                          >
                            <ModelIcon /> Creators
                          </a>
                        </Link>
                      </li>
                      <li
                        key="all-live"
                        className={
                          router.pathname === "/creator/all-live"
                            ? "active"
                            : ""
                        }
                      >
                        <Link href="/creator/all-live">
                          <a
                            onClick={() => this.setState({ opeMenu: false })}
                            aria-hidden
                          >
                            <LiveIcon /> Live
                          </a>
                        </Link>
                      </li>
                      <li
                        key="posts"
                        className={router.pathname === "/posts" ? "active" : ""}
                      >
                        <Link href="/posts">
                          <a
                            onClick={() => this.setState({ opeMenu: false })}
                            aria-hidden
                          >
                            <PictureOutlined /> Posts
                          </a>
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div className="nav-bar-right">
                <div className="nav-bar-title-service">
                  {/* <div className="nav-bar-link">
                    <Link href="/term-of-service">
                      <a>
                        <span className="title">Our Values</span>
                      </a>
                    </Link>
                  </div> */}
                  {/* search model */}
                  <SearchBarModel />
                  {user._id && (
                    <div
                      className="nav-bar-link-login"
                      aria-hidden
                      onClick={() => this.setState({ openProfile: true })}
                    >
                      {user?.avatar ? (
                        <Avatar src={user?.avatar || "/static/no-avatar.png"} />
                      ) : (
                        <UserOutlined />
                      )}
                    </div>
                  )}
                  {!user._id && (
                    <>
                      <div className="nav-bar-link-login">
                        <Link href="/auth/login">
                          <a>
                            <UserOutlined />
                          </a>
                        </Link>
                      </div>
                      <BtnHeaderLogin />
                    </>
                  )}
                </div>
                <div>{/* p2 */}</div>
              </div>
            </Layout.Header>
            <Drawer
              title={
                <>
                  <div className="profile-user">
                    <img
                      className="avatar"
                      src={user?.avatar || "/static/no-avatar.png"}
                      alt="avatar"
                    />
                    <span className="profile-name">
                      <span>
                        {user?.name || "N/A"} <TickIcon />
                      </span>
                      <span className="sub-name">
                        @{user?.username || "n/a"}
                      </span>
                    </span>
                  </div>
                  <div className="sub-info">
                    {user?._id && !user?.infoSubPerformer?._id && (
                      <a
                        aria-hidden
                        className="user-balance"
                        onClick={() =>
                          !user?.isPerformer
                            ? Router.push("/wallet")
                            : Router.push("/creator/earning")
                        }
                      >
                        <WalletSvg /> ${(user?.balance || 0).toFixed(2)}
                        {!user?.isPerformer && <PlusCircleOutlined />}
                      </a>
                    )}
                    {user.isPerformer ? (
                      privileges &&
                      (privileges?.includes("all") ||
                        privileges?.includes("subscription")) && (
                        <Link href="/creator/my-subscriber">
                          <a>
                            <StarOutlined />
                            Subscribers{" "}
                            {shortenLargeNumber(user?.stats?.subscribers || 0)}
                          </a>
                        </Link>
                      )
                    ) : (
                      <Link href="/user/my-subscription">
                        <a>
                          <HeartOutlined />
                          Subscription{" "}
                          {shortenLargeNumber(
                            user?.stats?.totalSubscriptions || 0
                          )}
                        </a>
                      </Link>
                    )}
                  </div>
                </>
              }
              closable
              onClose={() => this.setState({ openProfile: false })}
              visible={openProfile}
              key="profile-drawer"
              className={
                ui.theme === "light" ? "profile-drawer" : "profile-drawer dark"
              }
              width={280}
            >
              {user.isPerformer && (
                <div className="profile-menu-item">
                  {settings?.agoraEnable &&
                    (privileges?.includes("all") ||
                      privileges?.includes("streaming")) && (
                      <>
                        <Link
                          href={{ pathname: "/creator/live" }}
                          as="/creator/live"
                        >
                          <div
                            className={
                              router.asPath === "/creator/live"
                                ? "menu-item active"
                                : "menu-item"
                            }
                          >
                            <LiveIcon /> Go Live
                          </div>
                        </Link>
                        <Divider />
                      </>
                    )}
                  <Link
                    href={{
                      pathname: "/creator/profile",
                      query: { username: user.username || user._id },
                    }}
                    as={`/${user.username || user._id}`}
                  >
                    <div
                      className={
                        router.asPath === `/${user.username || user._id}`
                          ? "menu-item active"
                          : "menu-item"
                      }
                    >
                      <HomeIcon /> Preview Profile
                    </div>
                  </Link>
                  <Divider />
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("edit_profile")) && (
                      <Link href="/creator/account" as="/creator/account">
                        <div
                          className={
                            router.pathname === "/creator/account"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <UserOutlined /> Edit Profile
                        </div>
                      </Link>
                    )}
                  {/* {privileges && privileges?.includes('all') && user.accountManager === 'agency-managed' && (
                    <Link href="/creator/external-agency">
                      <div
                        className={
                          router.pathname === '/creator/external-agency'
                            ? 'menu-item active'
                            : 'menu-item'
                        }
                      >
                        <UserOutlined />
                        {' '}
                        External Agency
                      </div>
                    </Link>
                  )} */}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("black_list")) && (
                      <Link
                        href={{ pathname: "/creator/block-user" }}
                        as="/creator/block-user"
                      >
                        <div
                          className={
                            router.pathname === "/creator/block-user"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <BlockOutlined /> Blacklist
                        </div>
                      </Link>
                    )}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("block_countries")) && (
                      <Link
                        href={{ pathname: "/creator/block-countries" }}
                        as="/creator/block-countries"
                      >
                        <div
                          className={
                            router.pathname === "/creator/block-countries"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <StopOutlined /> Block Countries
                        </div>
                      </Link>
                    )}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("welcome_message")) && (
                      <Link
                        href={{ pathname: "/creator/welcome-message" }}
                        as="/creator/welcome-message"
                      >
                        <div
                          className={
                            router.pathname === "/creator/welcome-message"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <MessageOutlined /> Welcome Message
                        </div>
                      </Link>
                    )}
                  {user._id &&
                    user.isPerformer &&
                    !user?.infoSubPerformer?._id && (
                      <>
                        <Link
                          href={{ pathname: "/creator/banking" }}
                          as="/creator/banking"
                        >
                          <div
                            className={
                              router.pathname === "/creator/banking"
                                ? "menu-item active"
                                : "menu-item"
                            }
                          >
                            <BankOutlined /> Banking
                          </div>
                        </Link>
                        <Divider />
                      </>
                    )}
                  {user?.infoSubPerformer?._id && (
                    <>
                      <Link
                        href={{ pathname: "/sub-performer/banking" }}
                        as="/sub-performer/banking"
                      >
                        <div
                          className={
                            router.pathname === "/sub-performer/banking"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <BankOutlined /> My Bank Details
                        </div>
                      </Link>
                      {/* <Divider /> */}
                    </>
                  )}
                  {/* {user?.infoSubPerformer?._id && (
                    <>
                      <Link
                        href={{ pathname: '/sub-performer/referral' }}
                        as="/sub-performer/referral"
                      >
                        <div
                          className={
                            router.pathname === '/sub-performer/referral'
                              ? 'menu-item active'
                              : 'menu-item'
                          }
                        >
                          <GiftOutlined />
                          {' '}
                          Referral Managed
                        </div>
                      </Link>
                      <Divider />
                    </>
                  )}
                   */}
                  {/* {user?.infoSubPerformer?._id && (
                    <>
                      <Link
                        href={{ pathname: "/sub-performer/payout-request" }}
                        as="/sub-performer/payout-request"
                      >
                        <div
                          className={
                            router.pathname === "/sub-performer/payout-request"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <NotificationOutlined /> Payout Request Managed
                        </div>
                      </Link>
                      <Divider />
                    </>
                  )} */}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("referral")) && (
                      <>
                        <Link href="/creator/referral" as="/creator/referral">
                          <div
                            className={
                              router.pathname === "/creator/referral"
                                ? "menu-item active"
                                : "menu-item"
                            }
                          >
                            <GiftOutlined /> Referral
                          </div>
                        </Link>
                        <Divider />
                      </>
                    )}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("posting")) && (
                      <Link href="/creator/my-post" as="/creator/my-post">
                        <div
                          className={
                            router.pathname === "/creator/my-post"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <FireOutlined /> My Posts
                        </div>
                      </Link>
                    )}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("available_time")) && (
                      <Link
                        href="/creator/available-time"
                        as="/creator/available-time"
                      >
                        <div
                          className={
                            router.pathname === "/creator/available-time"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <FieldTimeOutlined /> Available Time
                        </div>
                      </Link>
                    )}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("booking_stream")) && (
                      <Link
                        href="/creator/book-stream"
                        as="/creator/book-stream"
                      >
                        <div
                          className={
                            router.pathname === "/creator/book-stream"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <BookOutlined /> My Schedules
                        </div>
                      </Link>
                    )}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("videos")) && (
                      <Link href="/creator/my-video" as="/creator/my-video">
                        <div
                          className={
                            router.pathname === "/creator/my-video"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <VideoCameraOutlined /> My Videos
                        </div>
                      </Link>
                    )}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("events")) && (
                      <Link href="/creator/events" as="/creator/events">
                        <div
                          className={
                            router.pathname === "/creator/events"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <DribbbleOutlined /> My Events
                        </div>
                      </Link>
                    )}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("products")) && (
                      <Link href="/creator/my-store" as="/creator/my-store">
                        <div
                          className={
                            router.pathname === "/creator/my-store"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <ShoppingOutlined /> My Products
                        </div>
                      </Link>
                    )}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("gallery")) && (
                      <>
                        <Link
                          href="/creator/my-gallery"
                          as="/creator/my-gallery"
                        >
                          <div
                            className={
                              router.pathname === "/creator/my-gallery"
                                ? "menu-item active"
                                : "menu-item"
                            }
                          >
                            <PictureOutlined /> My Galleries
                          </div>
                        </Link>
                        <Divider />
                      </>
                    )}
                  {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("order")) && (
                      <Link
                        href={{ pathname: "/creator/my-order" }}
                        as="/creator/my-order"
                      >
                        <div
                          className={
                            router.pathname === "/creator/my-order"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <ShoppingCartOutlined /> Order History
                        </div>
                      </Link>
                    )}
                  {user._id &&
                    user.isPerformer &&
                    !user?.infoSubPerformer?._id && (
                      <Link href="/creator/earning" as="/creator/earning">
                        <div
                          className={
                            router.pathname === "/creator/earning"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <DollarOutlined /> Earning History
                        </div>
                      </Link>
                    )}
                  {user?.infoSubPerformer?._id && (
                    <>
                      <Link
                        href={{ pathname: "/sub-performer/earning" }}
                        as="/sub-performer/earning"
                      >
                        <div
                          className={
                            router.pathname === "/sub-performer/earning"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <NotificationOutlined /> Agency Earning
                        </div>
                      </Link>
                      <Divider />
                    </>
                  )}
                  {/* {privileges &&
                    (privileges?.includes("all") ||
                      privileges?.includes("payout_request")) && (
                      <Link
                        href="/creator/payout-request"
                        as="/creator/payout-request"
                      >
                        <div
                          className={
                            router.pathname === "/creator/payout-request"
                              ? "menu-item active"
                              : "menu-item"
                          }
                        >
                          <NotificationOutlined /> Payout Requests
                        </div>
                      </Link>
                    )} */}
                  <Divider />
                  <div
                    aria-hidden
                    className="menu-item"
                    onClick={() => this.beforeLogout()}
                  >
                    <LogoutOutlined /> Sign Out
                  </div>
                </div>
              )}
              {!user.isPerformer && (
                <div className="profile-menu-item">
                  <Link href="/user/account" as="/user/account">
                    <div
                      className={
                        router.pathname === "/user/account"
                          ? "menu-item active"
                          : "menu-item"
                      }
                    >
                      <UserOutlined /> Edit Profile
                    </div>
                  </Link>
                  <Link href="/user/bookmarks" as="/user/bookmarks">
                    <div
                      className={
                        router.pathname === "/user/bookmarks"
                          ? "menu-item active"
                          : "menu-item"
                      }
                    >
                      <BookOutlined /> Bookmarks
                    </div>
                  </Link>
                  <Link href="/user/booking-stream" as="/user/booking-stream">
                    <div
                      className={
                        router.pathname === "/user/booking-stream"
                          ? "menu-item active"
                          : "menu-item"
                      }
                    >
                      <BookOutlined /> Booked live streaming
                    </div>
                  </Link>
                  <Link href="/user/my-subscription" as="/user/my-subscription">
                    <div
                      className={
                        router.pathname === "/user/my-subscriptions"
                          ? "menu-item active"
                          : "menu-item"
                      }
                    >
                      <HeartOutlined /> Subscriptions
                    </div>
                  </Link>
                  <Divider />
                  <Link href="/user/orders" as="/user/orders">
                    <div
                      className={
                        router.pathname === "/user/orders"
                          ? "menu-item active"
                          : "menu-item"
                      }
                    >
                      <ShoppingCartOutlined /> Order History
                    </div>
                  </Link>
                  <Link href="/user/payment-history" as="/user/payment-history">
                    <div
                      className={
                        router.pathname === "/user/payment-history"
                          ? "menu-item active"
                          : "menu-item"
                      }
                    >
                      <HistoryOutlined /> Payment History
                    </div>
                  </Link>
                  <Link
                    href="/user/wallet-transaction"
                    as="/user/wallet-transaction"
                  >
                    <div
                      className={
                        router.pathname === "/user/wallet-transaction"
                          ? "menu-item active"
                          : "menu-item"
                      }
                    >
                      <DollarOutlined /> Wallet Transactions
                    </div>
                  </Link>
                  <Divider />
                  <Link href="/user/referral" as="/user/referral">
                    <div
                      className={
                        router.pathname === "/user/referral"
                          ? "menu-item active"
                          : "menu-item"
                      }
                    >
                      <GiftOutlined /> Referral
                    </div>
                  </Link>
                  <Divider />
                  <div
                    className="menu-item"
                    aria-hidden
                    onClick={() => this.beforeLogout()}
                  >
                    <LogoutOutlined /> Sign Out
                  </div>
                </div>
              )}
              {/* <div className="switchTheme">
                <span>
                  <BulbOutlined />
                  <span>Switch Theme</span>
                </span>
                <Switch
                  onChange={this.onThemeChange.bind(this, ui.theme === 'dark' ? 'light' : 'dark')}
                  checked={ui.theme === 'dark'}
                  checkedChildren="Dark"
                  unCheckedChildren="Light"
                />
              </div> */}
            </Drawer>
            <SubscribePerformerModal onSubscribed={this.handleSubscribe} />
          </div>
          {/* show message error sub performer */}
          <div>
            <NotificationBankingSubPerformer user={user} />
          </div>
        </div>
      </Layout.Header>
    );
  }
}

Header.contextType = SocketContext;

const mapState = (state: any) => ({
  user: { ...state.user.current },
  ui: { ...state.ui },
  config: { ...state.settings },
  privileges: state.auth.privileges,
  ...state.streaming,
});
const mapDispatch = {
  logout,
  addPrivateRequest,
  accessPrivateRequest,
  updateUIValue,
  updateBalance,
  getFeeds,
};
export default withRouter(connect(mapState, mapDispatch)(Header)) as any;
