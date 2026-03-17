/* eslint-disable dot-notation */
import { PureComponent, createRef, forwardRef } from "react";
import Head from "next/head";
import { Layout, Row, Col, message, Button, Modal, Card } from "antd";
import { ClockCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { IResponse } from "src/services/api-request";
import {
  IPerformer,
  IUser,
  StreamSettings,
  IUIConfig,
  IStream,
  IBanner,
} from "src/interfaces";
import { connect } from "react-redux";
import {
  streamService,
  performerService,
  messageService,
  tokenTransctionService,
  bannerService,
} from "src/services";
import { SocketContext, Event } from "src/socket";
import nextCookie from "next-cookies";
import Router from "next/router";
import ChatBox from "@components/stream-chat/chat-box";
import { updateBalance } from "@redux/user/actions";
import {
  loadStreamMessages,
  getStreamConversationSuccess,
  getStreamConversation,
  resetStreamMessage,
} from "@redux/stream-chat/actions";
import {
  capitalizeFirstLetter,
  getResponseError,
  videoDuration,
} from "@lib/index";
import { PurchaseStreamForm } from "@components/streaming/confirm-purchase";
import { TipPerformerForm } from "@components/performer";
import dynamic from "next/dynamic";
import "./index.less";
import Error from "next/error";
import { SubscriberProps } from "@components/streaming/agora/subscriber";
import Loader from "@components/common/base/loader";
import InfoPerformerStreaming from "@components/streaming/info-performer-stream";
import UpcomingBookStream from "@components/performer/upcoming-stream";
import InfoAllProductPerformer from "@components/streaming/info-product-performer";

const AgoraProvider = dynamic(() => import("src/agora/AgoraProvider"), {
  ssr: false,
});
const Subscriber = dynamic(
  () => import("@components/streaming/agora/subscriber"),
  { ssr: false }
);
const ForwardedSubscriber = forwardRef((props: SubscriberProps, ref) => (
  <Subscriber {...props} forwardedRef={ref} />
));

// eslint-disable-next-line no-shadow
enum STREAM_EVENT {
  JOIN_BROADCASTER = "join-broadcaster",
  MODEL_LEFT = "model-left",
  ROOM_INFORMATION_CHANGED = "public-room-changed",
  ROOM_EARNING_CHANGED = "public-earning-changed",
  MODEL_REDIRECT_PRIVATE_LIVE = "redirect-private-chat",
  BALANCE_UPDATE = "update_balance_stream",
}

interface IProps {
  updateBalance: Function;
  resetStreamMessage: Function;
  getStreamConversationSuccess: Function;
  loadStreamMessages: Function;
  getStreamConversation: Function;
  activeConversation: any;
  ui: IUIConfig;
  user: IUser;
  performer: IPerformer;
  stream: IStream;
  settings: StreamSettings;
  banners: IBanner[];
}

class LivePage extends PureComponent<IProps> {
  static layout = "stream";

  static authenticate = true;

  private client: any;

  private subscriberRef = createRef<{ join: any; unsubscribe: any }>();

  private streamDurationTimeOut: any;

  private interval = null;

  static async getInitialProps({ ctx }) {
    try {
      const { query } = ctx;
      const { token } = nextCookie(ctx);
      const headers = { Authorization: token };
      const resp: IResponse<IPerformer> = await performerService.findOne(
        query.username,
        headers
      );

      const stream = await streamService.joinPublicChat(resp.data._id, headers);
      const banners = await bannerService.search({ limit: 99 });
      return {
        performer: resp.data,
        stream: stream.data,
        banners: banners?.data?.data || [],
      };
    } catch (e) {
      if (process.browser) {
        return Router.back();
      }

      ctx.res.writeHead && ctx.res.writeHead(302, { Location: "/" });
      ctx.res.end && ctx.res.end();
      return {};
    }
  }

  state = {
    total: 0,
    sessionDuration: 0,
    openPurchaseModal: false,
    submiting: false,
    openTipModal: false,
    initialized: false,
    errorCheckBlockCountry: null,
    checkingBlockCountry: true,
    earningStream: 0,
    isUserUnpublished: false,
    hasLoggedMessage: false,
  };

  componentDidMount() {
    window && window.scrollTo(0, 0);
    const { performer, user, stream: activeStream } = this.props;
    this.checkBlockCountry();
    if (!performer || user.isPerformer) {
      Router.back();
      return;
    }
    if (performer?.streamingStatus === "private") {
      message.error(
        `${
          performer?.name || performer?.username
        } is currently in a private stream. Please try again later.`,
        5
      );
      return;
    }
    if (activeStream.optionStream === "subscribe" && !performer.isSubscribed) {
      message.error("Please subscribe to join live chat!", 5);
      Router.push(
        {
          pathname: "/creator/profile",
          query: { username: performer?.username || performer?._id },
        },
        `/${performer?.username || performer?._id}`
      );
      return;
    }

    if (activeStream.optionStream === "free") {
      this.joinConversation(true);
    } else {
      this.joinConversation();
    }
    this.setState({ earningStream: activeStream.price });
    Router.events.on("routeChangeStart", this.onbeforeunload.bind(this));
    window.addEventListener("beforeunload", this.onbeforeunload.bind(this));
  }

  componentWillUnmount() {
    this.clearInterval();
    window.removeEventListener("beforeunload", this.onbeforeunload.bind(this));
    Router.events.off("routeChangeStart", this.onbeforeunload.bind(this));
  }

  // eslint-disable-next-line react/sort-comp
  handleDuration() {
    const { sessionDuration } = this.state;
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    this.setState({ sessionDuration: sessionDuration + 1 });
    this.streamDurationTimeOut = setTimeout(
      this.handleDuration.bind(this),
      1000
    );
  }

  onStreamStatusChange = (streaming: boolean) => {
    if (!streaming) {
      this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    } else {
      this.setState({ initialized: true });
      !this.streamDurationTimeOut && this.handleDuration();
    }
  };

  onbeforeunload = () => {
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    this.leavePublicRoom();
  };

  onChangeMembers({ total, conversationId }) {
    const { activeConversation, stream: activeStream } = this.props;
    if (activeConversation?.data?._id === conversationId) {
      this.setState({ total });
      // this.getEarningLiveStream();
      // this.getTotalPurchasedStream(activeStream);
    }
  }

  onShowMessageNotify() {
    const { performer } = this.props;
    message.info(
      `${
        performer?.name || performer?.username
      } is streaming privately. Try to connect later`,
      10
    );
  }

  getTotalPurchasedStream = async (activeStream: IStream) => {
    try {
      const resp = await streamService.searchLive(activeStream._id);
      this.setState({
        earningStream: (resp?.data?.totalPurchased || 0) * activeStream.price,
      });
    } catch (e) {
      const error = await e;
      message.error(error?.message || "Error occurred please try again");
    }
  };

  handleCountTotalPurchase = async ({ streamId }) => {
    const { stream: activeStream } = this.props;
    try {
      this.setState((prevState: any) => ({
        earningStream: prevState?.earningStream + activeStream.price,
      }));
    } catch (e) {
      const error = await e;
      message.error(error?.message || "Error occurred please try again");
    }
  };

  // onChangeEarnings({ totalPurchasedEarning }) {
  //   const { stream: activeStream } = this.props;
  //   if (totalPurchasedEarning) {
  //     this.setState({ earningStream: totalPurchasedEarning * activeStream.price });
  //   }
  // }

  // async getEarningLiveStream() {
  //   const { activeConversation } = this.props;
  //   try {
  //     await tokenTransctionService.searchEarningStream(activeConversation?.data?._id);
  //   } catch (e) {
  //     const error = await e;
  //     message.error(getResponseError(error));
  //   }
  // }

  async purchaseStream() {
    const { stream: activeStream } = this.props;
    const { user, updateBalance: handleUpdateBalance } = this.props;
    if (activeStream.isFree || !activeStream.sessionId) return;
    if (user.balance < activeStream.price) {
      message.error(
        "You have an insufficient wallet balance. Please top up.",
        10
      );
      window.location.href = "/wallet";
      return;
    }
    try {
      await this.setState({ submiting: true });
      // await tokenTransctionService.purchaseStream(activeStream._id);
      // handleUpdateBalance({ token: -activeStream.price });
      await this.joinConversation(true);
    } catch (e) {
      const error = await e;
      message.error(error?.message || "Error occurred, please try again later");
    } finally {
      this.setState({ submiting: false });
    }
  }

  confirmJoinStream() {
    this.purchaseStream();
    this.setState({ openPurchaseModal: false });
  }

  async retryJoin(n: number) {
    const { performer } = this.props;
    if (n === 0) return;

    if (!this.subscriberRef.current) {
      setTimeout(() => this.retryJoin(n - 1), 3000);
      return;
    }

    this.client = (await this.subscriberRef.current.join()) as any;
    this.client.on("user-unpublished", async () => {
      if (!this.state.isUserUnpublished) {
        this.setState({ isUserUnpublished: true }, async () => {
          if (!this.state.hasLoggedMessage) {
            await message.info(`User is Offline`);
            this.setState({ hasLoggedMessage: true });
          }
          this.setState({ sessionDuration: 0 });
          this.streamDurationTimeOut &&
            clearTimeout(this.streamDurationTimeOut);
          setTimeout(() => {
            window.location.href = `/${performer?.username || performer?._id}`;
          }, 10 * 1000);
        });
      }
    });
  }

  async subscribeStream({ performerId, conversationId }) {
    const { initialized } = this.state;
    const { activeConversation } = this.props;

    if (activeConversation?.data?._id !== conversationId) return;

    try {
      const resp = await streamService.joinPublicChat(performerId);
      const { streamingTime } = resp.data;
      // this.setState({ sessionDuration: streamingTime || 0 });

      !initialized && this.retryJoin(3);
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  }

  async joinConversation(purchased = false) {
    const {
      user,
      performer,
      getStreamConversationSuccess: dispatchGetStreamConversationSuccess,
      getStreamConversation: dispatchGetStreamConversation,
      stream,
      updateBalance,
    } = this.props;

    const socket = this.context;

    try {
      if (!purchased) {
        if (!stream.isFree && !stream.hasPurchased) {
          this.setState({ openPurchaseModal: true });
          return;
        }
      }
      await tokenTransctionService.purchaseStream(stream._id);
      updateBalance({ token: -stream.price });
      const resp = await messageService.findPublicConversationPerformer(
        performer._id
      );
      const conversation = resp.data;
      if (conversation && conversation._id) {
        dispatchGetStreamConversationSuccess({ data: conversation });
        dispatchGetStreamConversation({
          conversation,
        });
        socket &&
          socket.emit("public-stream/join", {
            conversationId: conversation._id,
          });
      } else {
        message.info("No available stream. Try again later");
      }
      this.interval = setInterval(async () => {
        if (user.balance < stream.price) {
          message.error(
            "You have an insufficient wallet balance. Please top up.",
            10
          );
          window.location.href = "/wallet";

          clearInterval(this.interval);
          return;
        }
        await tokenTransctionService.purchaseStream(stream._id);
        updateBalance({ token: -stream.price });
      }, 60000);
    } catch (e) {
      const error = await e;
      message.error(error.message || "An error occurred");
    }
  }

  clearInterval = () => {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  };

  async removeRequest() {
    const { performer } = this.props;
    try {
      await streamService.userRemoveRequest({ performerId: performer._id });
    } catch (error) {
      //
    }
  }

  leavePublicRoom() {
    const socket = this.context;
    const {
      activeConversation,
      resetStreamMessage: dispatchResetStreamMessage,
    } = this.props;
    dispatchResetStreamMessage();
    if (socket && activeConversation?.data?._id) {
      socket.emit("public-stream/leave", {
        conversationId: activeConversation?.data?._id,
      });
    }
  }

  modelLeftHandler({ conversationId, performerId }) {
    const { performer, activeConversation } = this.props;
    if (
      activeConversation?.data?._id !== conversationId ||
      performer?._id !== performerId
    ) {
      return;
    }

    this.setState({ sessionDuration: 0 });
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    message.info("Streaming session ended! Redirecting after 10s", 10);
    setTimeout(() => {
      window.location.href = `/${performer?.username || performer?._id}`;
    }, 10 * 1000);
  }

  async sendTip(token) {
    const {
      performer,
      user,
      updateBalance: handleUpdateBalance,
      activeConversation,
    } = this.props;
    const { stream: activeStream } = this.props;
    if (user.balance < token) {
      message.error("You have an insufficient wallet balance. Please top up.");
      window.location.href = "/wallet";

      return;
    }
    try {
      await this.setState({ submiting: true });
      await tokenTransctionService.sendTip(performer?._id, {
        price: token,
        conversationId: activeConversation?.data?._id,
        sessionId: activeStream?.sessionId,
        streamType: "stream_public",
      });
      message.success("Thank you for the tip!");
      handleUpdateBalance({ token: -token });
    } catch (e) {
      const err = await e;
      message.error(err.message || "Error occurred, please try again later");
    } finally {
      this.setState({ submiting: false, openTipModal: false });
    }
  }

  async handleStopStream(performer) {
    this.removeRequest();
    window.location.href = `/${performer?.username || performer?._id}`;
  }

  async checkBlockCountry() {
    const { performer } = this.props;
    try {
      await performerService.checkBlockCountry(performer?.username);
    } catch (e) {
      const error = await e;
      this.setState({ errorCheckBlockCountry: error });
    } finally {
      this.setState({ checkingBlockCountry: false });
    }
  }

  render() {
    const {
      performer,
      user,
      ui,
      stream: activeStream,
      settings,
      banners,
    } = this.props;
    const {
      total,
      openPurchaseModal,
      sessionDuration,
      submiting,
      openTipModal,
      errorCheckBlockCountry,
      checkingBlockCountry,
      earningStream,
    } = this.state;
    if (errorCheckBlockCountry) {
      return (
        <Error
          statusCode={errorCheckBlockCountry?.statusCode || 404}
          title={
            errorCheckBlockCountry?.message || "Sorry, we can't find this page"
          }
        />
      );
    }
    const topBanners =
      banners &&
      banners.length > 0 &&
      banners.filter((b) => b.position === "liveStreaming");

    return (
      <Layout>
        {checkingBlockCountry ? (
          <Loader />
        ) : (
          <>
            <Head>
              <title>
                {`${ui?.siteName || ""} | ${
                  performer?.name || performer?.username
                } Broadcast`}
              </title>
            </Head>
            <Event
              event={STREAM_EVENT.JOIN_BROADCASTER}
              handler={this.subscribeStream.bind(this)}
            />
            <Event
              event={STREAM_EVENT.MODEL_LEFT}
              handler={this.modelLeftHandler.bind(this)}
            />
            <Event
              event={STREAM_EVENT.ROOM_INFORMATION_CHANGED}
              handler={this.onChangeMembers.bind(this)}
            />
            <Event
              event={STREAM_EVENT.MODEL_REDIRECT_PRIVATE_LIVE}
              handler={this.onShowMessageNotify.bind(this)}
            />
            <Event
              event={STREAM_EVENT.BALANCE_UPDATE}
              handler={this.handleCountTotalPurchase.bind(this)}
            />
            {/* <Event
                event={STREAM_EVENT.ROOM_EARNING_CHANGED}
                handler={this.onChangeEarnings.bind(this)}
              /> */}
            <AgoraProvider
              config={{ codec: "h264", mode: "live", role: "audience" }}
            >
              <div className="user-stream-details">
                <Row>
                  <Col lg={16} md={16} xs={24}>
                    <div className="stream-video">
                      <ForwardedSubscriber
                        localUId={user?._id}
                        remoteUId={performer?._id}
                        ref={this.subscriberRef}
                        sessionId={activeStream?.sessionId}
                        onStreamStatusChange={(val) =>
                          this.onStreamStatusChange(val)
                        }
                      />
                    </div>
                    <div className="stream-duration">
                      <span style={{ marginRight: 5 }}>
                        <ClockCircleOutlined /> {videoDuration(sessionDuration)}
                      </span>
                      <span>${(earningStream || 0).toFixed(2)}</span>
                      <span>
                        <EyeOutlined /> {total}
                      </span>
                    </div>
                  </Col>
                  <Col lg={8} md={8} xs={24}>
                    <ChatBox
                      {...this.props}
                      performer={performer}
                      activeStream={activeStream}
                    />
                    <Row>
                      <Col lg={24} xs={24}>
                        <Card bordered={false} bodyStyle={{ padding: 0 }}>
                          <Card.Meta
                            title={
                              activeStream?.title ||
                              `${performer?.name || performer?.username} Live`
                            }
                            // description={
                            //   activeStream?.description || 'No description'
                            // }
                          />
                        </Card>
                      </Col>
                      <Col lg={24} xs={24}>
                        {activeStream?.description === "upcoming" ? (
                          <Row className="user-stream-btn-options">
                            <Col xs={24} md={12} lg={12}>
                              <Button
                                block
                                className="secondary"
                                onClick={() => this.handleStopStream(performer)}
                              >
                                Leave Chat
                              </Button>
                            </Col>
                            <Col xs={24} md={12} lg={12}>
                              <Button
                                block
                                className="secondary"
                                disabled={submiting}
                                onClick={() =>
                                  this.setState({ openTipModal: true })
                                }
                              >
                                Send Tip
                              </Button>
                            </Col>
                          </Row>
                        ) : (
                          <Row className="user-stream-btn-options">
                            <Col xs={24} md={12} lg={8}>
                              <Button
                                block
                                className="secondary"
                                onClick={() =>
                                  (window.location.href = `/private-streaming/privatechat/${
                                    performer?.username || performer?._id
                                  }`)
                                }
                              >
                                Private Call
                              </Button>
                            </Col>
                            <Col xs={24} md={12} lg={8}>
                              <Button
                                block
                                className="secondary"
                                onClick={() => this.handleStopStream(performer)}
                              >
                                Leave Chat
                              </Button>
                            </Col>
                            <Col xs={24} md={12} lg={8}>
                              <Button
                                block
                                className="secondary"
                                disabled={submiting}
                                onClick={() =>
                                  this.setState({ openTipModal: true })
                                }
                              >
                                Send Tip
                              </Button>
                            </Col>
                          </Row>
                        )}
                      </Col>
                    </Row>
                  </Col>
                </Row>
                <Row>
                  <Col lg={6} md={8} xs={24}>
                    <InfoPerformerStreaming user={performer} />
                  </Col>
                  <Col lg={18} md={16} xs={24}>
                    <InfoAllProductPerformer performer={performer} />
                  </Col>
                </Row>
                <Modal
                  key="tip"
                  centered
                  title={null}
                  visible={openTipModal}
                  onOk={() => this.setState({ openTipModal: false })}
                  footer={null}
                  onCancel={() => this.setState({ openTipModal: false })}
                  width={600}
                >
                  <TipPerformerForm
                    performer={performer}
                    submiting={submiting}
                    onFinish={this.sendTip.bind(this)}
                  />
                </Modal>
                <Modal
                  centered
                  key="confirm_join_stream"
                  title={`Join ${
                    capitalizeFirstLetter(performer?.name) ||
                    capitalizeFirstLetter(performer?.username) ||
                    "N/A"
                  } live chat`}
                  visible={openPurchaseModal}
                  footer={null}
                  destroyOnClose
                  // closable={false}
                  maskClosable={false}
                  onCancel={() => Router.back()}
                >
                  <PurchaseStreamForm
                    submiting={submiting}
                    performer={performer}
                    activeStream={activeStream}
                    onFinish={this.confirmJoinStream.bind(this)}
                  />
                </Modal>
              </div>
            </AgoraProvider>
            <UpcomingBookStream
              user={user}
              settings={settings}
              topBanners={topBanners}
              performer={performer}
            />
          </>
        )}
      </Layout>
    );
  }
}

LivePage.contextType = SocketContext;

const mapStateToProps = (state) => ({
  ui: { ...state.ui },
  ...state.streaming,
  settings: { ...state.settings },
  user: { ...state.user.current },
  activeConversation: { ...state.streamMessage.activeConversation },
});
const mapDispatch = {
  updateBalance,
  loadStreamMessages,
  getStreamConversationSuccess,
  resetStreamMessage,
  getStreamConversation,
};
export default connect(mapStateToProps, mapDispatch)(LivePage);
