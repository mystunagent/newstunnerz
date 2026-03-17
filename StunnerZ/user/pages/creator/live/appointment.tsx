/* eslint-disable dot-notation */
import React, { PureComponent, createRef, forwardRef } from "react";
import Head from "next/head";
import { Row, Col, Button, message, Layout } from "antd";
import { connect } from "react-redux";
import {
  IPerformer,
  IUIConfig,
  StreamSettings,
  IStream,
  IConversation,
} from "src/interfaces";
import { streamService } from "src/services";
import { SocketContext } from "src/socket";
import Router, { Router as RouterEvent } from "next/router";
import dynamic from "next/dynamic";
import "./index.less";
import Error from "next/error";
import { LiveIcon, WalletIcon } from "src/icons";
import { ClockCircleOutlined } from "@ant-design/icons";
import CallTime from "@components/streaming/call-time";
import Price from "@components/streaming/price";
import CountTokenInPrivateStream from "@components/streaming/count-token";
import ChatBoxPublicStream from "@components/stream-chat/chat-box-public";
import {
  getStreamConversation,
  resetAllStreamMessage,
  resetStreamMessage,
} from "@redux/stream-chat/actions";
import { redirectTo } from "@lib/utils";

const AgoraProvider = dynamic(() => import("src/agora/AgoraProvider"), {
  ssr: false,
});
const PrivateLiveStreaming = dynamic(
  () => import("@components/streaming/agora/private-booking-live-streaming"),
  { ssr: false }
);
const Event = dynamic(() => import("src/socket/Event"), { ssr: false });

const ForwardedPublisher = forwardRef(
  (
    props: {
      localUID: string;
      remoteUID: string;
      conversationId: string;
      sessionId: string;
      eventName: string;
    },
    ref
  ) => <PrivateLiveStreaming {...props} forwardedRef={ref} />
);

// eslint-disable-next-line no-shadow
enum EVENT_NAME {
  LEAVE_STREAM = "private-stream/leave",
  JOIN_BROADCASTER = 'join-broadcaster',
  LEFT_BROADCASTER = 'left-broadcaster',
  MODEL_LEFT = 'model-left',
  MODEL_JOIN_PRIVATE_CHAT = 'model-joined',
  MODEL_JOIN_PRIVATE = 'private-stream/model-join',
  MODEL_LEFT_PRIVATE = 'private-stream/model-left',
  USER_LEFT_PRIVATE = 'private-stream/user-left',
  USER_JOIN_PRIVATE = 'private-stream/user-join',
}

interface IProps {
  ui: IUIConfig;
  settings: StreamSettings;
  resetStreamMessage: Function;
  resetAllStreamMessage: Function;
  getStreamConversation: Function;
  activeConversation: any;
  user: IPerformer;
  activeStream: IStream;
  conversation: IConversation;
  requestId: string;
  upcoming: any;
}

interface IStates {
  loading: boolean;
  initialized: boolean;
  members?: any;
  showEndStream: boolean;
  startCountToken: boolean;
  isUserUnpublished: boolean;
  hasLoggedMessage: boolean;
  oneShow: boolean;
}

class PerformerBookingLivePage extends PureComponent<IProps, IStates> {
  static layout = "stream";

  static authenticate = true;

  private client: any;

  private publisherRef = createRef<{ publish: any; leave: any }>();

  private callTimeRef = createRef<any>();

  intervalId = null;

  static async getInitialProps({ ctx }) {
    const { conversationId } = ctx.query;
    try {
      if (!conversationId) {
        if (typeof window !== 'undefined') message.info('Stream not exists', 5);
        return redirectTo('/');
      }

      const resp = await streamService.getBookPrivateChat(conversationId);
      if (!resp) {
        if (typeof window !== 'undefined') message.info('Stream not exists', 5);
        return redirectTo('/');
      }
      return {
        activeStream: resp.data.activeStream,
        conversation: resp.data.conversation,
        requestId: conversationId,
        upcoming: resp.data?.upcoming,
      };
    } catch {
      if (typeof window !== 'undefined') {
        message.error("Sometime wrong, please try again", 5);
      }
      return redirectTo('/');
    }
  }

  state = {
    loading: false,
    initialized: false,
    showEndStream: true,
    startCountToken: false,
    isUserUnpublished: false,
    hasLoggedMessage: false,
    members: null,
    oneShow: true,
  };

  componentDidMount() {
    const { user } = this.props;
    if (!user || !user.verifiedDocument) {
      message.warning(
        "Your account is not verified ID documents yet! You could not post any content right now."
      );
      Router.back();
      return;
    }

    this.init();
    this.countTimeToEnd();
    setTimeout(() => {
      this.start();
    }, 5000);
    window.addEventListener("beforeunload", this.onbeforeunload.bind(this));
    RouterEvent.events.on("routeChangeStart", this.onbeforeunload.bind(this));
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    window.removeEventListener("beforeunload", this.onbeforeunload.bind(this));
    RouterEvent.events.off("routeChangeStart", this.onbeforeunload.bind(this));
  }

  onbeforeunload = () => {
    this.leave();
  };

  async checkMemberRoom() {
    const { activeStream } = this.props;
    try {
      const { data } = await streamService.getMemberRoomBooking(
        activeStream?.sessionId
      );
      this.setState({ members: data });
    } catch (error) {
      //
    }
  }

  async countTimeToEnd() {
    const { upcoming, user } = this.props;
    const { oneShow } = this.state;
    if (upcoming) {
      this.intervalId = setInterval(() => {
        const now = new Date();
        const endTime = new Date(upcoming.endAt);
        const oneMinuteBefore = new Date(endTime.getTime() - 60 * 1000);

        if (now >= endTime) {
          clearInterval(this.intervalId);
          this.handleModelLeft();
        } else if (now >= oneMinuteBefore) {
          if (oneShow === true) {
            message.info("The stream will end after 1 minutes", 10);
            this.setState({ oneShow: false });
          }
        }
      }, 60000);
    }
  }

  async init() {
    const {
      getStreamConversation: dispatchGetStreamConversation,
      conversation,
    } = this.props;
    if (!conversation) return;

    const socket = this.context;
    try {
      this.setState({ loading: true });
      dispatchGetStreamConversation({
        conversation,
      });
      socket &&
        socket.emit("private-stream/join", {
          conversationId: conversation._id,
        });
    } catch (e) {
      const error = await e;
      message.error(
        error?.message || "Stream server error, please try again later"
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  async start() {
    if (!this.publisherRef.current) return;

    const {
      requestId,
      activeStream,
      conversation,
      getStreamConversation: dispatchGetStreamConversation,
    } = this.props;

    const socket = this.context;
    dispatchGetStreamConversation({
      conversation,
    });
    socket &&
      socket.emit("private-stream/join", {
        conversationId: conversation._id,
      });

    this.client = (await this.publisherRef.current.publish()) as any;

    // this.setState({ initialized: true, startCountToken: true });

    this.client.on("user-published", (user) => {
      if (user.uid === activeStream.userId) {
        this.callTimeRef.current && this.callTimeRef.current.start();
      }
    });
    this.client.on("user-unpublished", async () => {
      if (!this.state.isUserUnpublished) {
        this.setState({ isUserUnpublished: true }, async () => {
          if (!this.state.hasLoggedMessage) {
            await message.info(`User is Offline`);
            this.setState({ hasLoggedMessage: true });
          }
          this.callTimeRef.current && this.callTimeRef.current.stop();
          this.setState({ startCountToken: false });
        });
      }
      this.callTimeRef.current && this.callTimeRef.current.stop();
      this.setState({ startCountToken: false });
    });
  }

  handleUserLeft = () => {
    const { showEndStream } = this.state;
    const { user } = this.props;

    if (showEndStream) {
      message.info(
        "User ended private chat, you will redirect to profile page after 5 seconds",
        5
      );
      this.setState({ showEndStream: false });
    }
    setTimeout(() => {
      window.location.href = `/${user?.username}`;
      this.leave2();
    }, 5000);
  }

  handleModelLeft = () => {
    this.callTimeRef.current && this.callTimeRef.current.stop();
    this.leave2();
  }

  handleUserJoinRoom = ({ stream }) => {
    const { activeStream } = this.props;

    if (stream?._id === activeStream?._id) {
      message.info("User join room");
      this.setState({ initialized: true, startCountToken: true });
    }
  }

  async leave() {
    const { user } = this.props;

    if (!window.confirm("Are you sure you want to leave?")) return;
    window.location.href = `/${user?.username}`;
    const {
      conversation,
      resetStreamMessage: reset,
      activeStream,
    } = this.props;
    const socket = this.context;
    this.callTimeRef.current && this.callTimeRef.current.stop();
    await streamService.sendNotifyModelLeftRoomPrivate({
      id: activeStream?._id,
    });
    if (socket && conversation && conversation._id) {
      socket.emit(EVENT_NAME.LEAVE_STREAM, {
        conversationId: conversation._id,
        performerId: activeStream?.performerId,
      });
      reset();
    }
  }

  async leave2() {
    const { user } = this.props;

    window.location.href = `/${user?.username}`;
    const {
      conversation,
      resetStreamMessage: reset,
      activeStream,
    } = this.props;
    const socket = this.context;
    this.callTimeRef.current && this.callTimeRef.current.stop();
    if (socket && conversation && conversation._id) {
      socket.emit(EVENT_NAME.LEAVE_STREAM, {
        conversationId: conversation._id,
        performerId: activeStream?.performerId,
      });
      reset();
    }
  }

  render() {
    const { ui, activeStream, conversation, user } = this.props;
    const { loading, initialized, startCountToken, members } = this.state;

    if (!activeStream) return <Error statusCode={404} />;

    return (
      <AgoraProvider config={{ mode: "rtc", codec: "h264", role: "host" }}>
        <Layout>
          <Head>
            <title>{`${ui?.siteName} | Private Live`}</title>
          </Head>
          <Event
            event={EVENT_NAME.MODEL_LEFT}
            handler={this.handleModelLeft.bind(this)}
          />
          <Event
            event={EVENT_NAME.USER_LEFT_PRIVATE}
            handler={this.handleUserLeft.bind(this)}
          />
          <Event
            event={EVENT_NAME.USER_JOIN_PRIVATE}
            handler={this.handleUserJoinRoom.bind(this)}
          />
          <div>
            <Row className="main-container">
              <Col xs={24} sm={24} md={16} style={{ padding: 10 }}>
                <ForwardedPublisher
                  localUID={activeStream?.performerId}
                  remoteUID={activeStream?.userId}
                  ref={this.publisherRef}
                  conversationId={conversation?._id}
                  sessionId={activeStream?.sessionId}
                  eventName="private-stream/live"
                />
                <div className="left-top-streaming">
                  <div style={{ marginRight: 5 }}>
                    <ClockCircleOutlined
                      width={18}
                      style={{ marginRight: 5 }}
                    />
                    <CallTime ref={this.callTimeRef} started={initialized} />
                  </div>
                  <div className="custom-wallet">
                    <WalletIcon />{" "}
                    <Price
                      amount={user?.pricePerMinuteBookStream || 0}
                      text="per minute"
                    />
                  </div>
                  <CountTokenInPrivateStream
                    start={startCountToken}
                    priceDefault={Number(user?.pricePerMinuteBookStream)}
                  />
                </div>
                <div className="show-streaming-box">
                  <div className="show-streaming-center">
                    <div className="box-streaming-center">
                      <div className="streaming-content">
                        <p>
                          <LiveIcon />
                        </p>
                        <span>1-1 Private Streaming</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Button
                    key="start-btn"
                    className="primary"
                    disabled={loading}
                    onClick={() => this.leave()}
                    block
                  >
                    Stop Broadcasting
                  </Button>
                </div>
              </Col>
              <Col xs={24} sm={24} md={8} style={{ padding: 10 }}>
                <ChatBoxPublicStream {...this.props} />
              </Col>
            </Row>
          </div>
        </Layout>
      </AgoraProvider>
    );
  }
}

PerformerBookingLivePage.contextType = SocketContext;

const mapStateToProps = (state) => ({
  ui: { ...state.ui },
  ...state.streaming,
  user: { ...state.user.current },
  activeConversation: { ...state.streamMessage.activeConversation },
});
const mapDispatchs = {
  getStreamConversation,
  resetStreamMessage,
  resetAllStreamMessage,
};
export default connect(mapStateToProps, mapDispatchs)(PerformerBookingLivePage);
