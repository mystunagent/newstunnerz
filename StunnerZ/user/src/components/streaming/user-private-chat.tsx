import { IPerformer } from "@interfaces/index";
import {
  getStreamConversation,
  getStreamConversationSuccess,
  resetStreamMessage,
} from "@redux/stream-chat/actions";
import { updateBalance } from "@redux/user/actions";
import { tokenTransctionService } from "@services/token-transaction.service";
import { Button, Col, message, Modal, Row } from "antd";
import dynamic from "next/dynamic";
import Router from "next/router";
import { forwardRef, useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SocketContext } from "src/socket";
import { LiveIcon, WalletIcon } from "src/icons";
import { ClockCircleOutlined } from "@ant-design/icons";
import { STREAM_EVENT } from "./private-streaming-container";
import CallTime from "./call-time";
import { MuteButton } from "./mute-btn";
import { TipPerformerForm } from "@components/performer";
import ChatBoxPublicStream from "@components/stream-chat/chat-box-public";
import "./private-streaming-container.less";
import { streamService } from "@services/stream.service";

const AgoraProvider = dynamic(() => import("src/agora/AgoraProvider"), {
  ssr: false,
});

const PrivateLiveStreaming = dynamic(
  () => import("@components/streaming/agora/private-user-booking-live-streaming"),
  { ssr: false }
);

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

interface IProps {
  activeStream: any;
  performer: IPerformer;
  conversation: any;
  activeConversation: any;
}

function UserPrivateStreamWapper({
  performer,
  activeStream,
  conversation,
  activeConversation,
}: IProps) {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.current);
  const subscriberRef = useRef<{ publish: any; leave: any }>();
  const [remoteUID, setRemoteUID] = useState<string>();
  const [openTipModal, setOpenTipModal] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [tokenSpent, setTokenSpent] = useState<number>(
    performer?.pricePerMinuteBookStream || 0
  );
  const [startTime, setStartTime] = useState(false);
  const [startPay, setStartPay] = useState(true);
  const [showNotify, setShowNotify] = useState(true);
  const callTimeRef = useRef(null);

  const socket = useContext(SocketContext);

  const leave = async () => {
    dispatch(resetStreamMessage());
    if (socket && conversation?._id) {
      socket.emit(STREAM_EVENT.PRIVATE_LEAVE_ROOM, {
        conversationId: conversation?._id,
      });
    }
    await streamService.sendNotifyUserLeftRoomPrivate({
      id: activeStream?._id,
    });
    await streamService.userRemoveRequest({ performerId: conversation?.performerId });
    socket && socket.off(STREAM_EVENT.JOIN_BROADCASTER);
  };

  const onBeforeUnload = () => {
    leave();
  };

  const purchaseStream = async () => {
    if (user.balance < performer?.pricePerMinuteBookStream) {
      message.error(
        "You have an insufficient wallet balance. Please top up.",
        15
      );
      // Not Found
      window.location.href = "/wallet";

      return;
    }
    try {
      await tokenTransctionService.purchasePrivateStream(activeStream?._id, {
        price: Number(performer?.pricePerMinuteBookStream).toFixed(0),
      });
      dispatch(
        updateBalance({ token: performer.pricePerMinuteBookStream * -1 })
      );
      setTimeout(() => {
        purchaseStream();
      }, 60000);
    } catch (e) {
      const err = await e;
      message.error(err.message || "An error occurred");
    }
  };

  const retryJoin = async (n: number) => {
    try {
      if (n === 0) return;

      if (!subscriberRef.current) {
        setTimeout(() => retryJoin(n - 1), 3000);
        return;
      }

      const client = await subscriberRef.current.publish();

      setInitialized(true);

      client.on("user-published", (_user) => {
        if (_user.uid === activeStream.performerId) {
          if (remoteUID === user.uid) return;

          setRemoteUID(_user.uid);
          callTimeRef.current && callTimeRef.current.start();
        }
      });

      client.on("user-unpublished", async () => {
        callTimeRef.current && callTimeRef.current.stop();
      });
    } catch (e) {
      const err = await e;
      message.error(err.message || "An error occurred");
    }
  };

  const start = async () => {
    try {
      if (conversation && conversation._id) {
        dispatch(getStreamConversationSuccess({ data: conversation }));
        dispatch(getStreamConversation({ conversation }));
        socket &&
          socket.emit(STREAM_EVENT.PRIVATE_JOIN_ROOM, {
            conversationId: conversation._id,
          });
        !initialized && retryJoin(3);
      } else {
        message.info("No available stream. Try again later");
      }
    } catch (e) {
      const err = await e;
      message.error(err.message || "An error occurred");
    }
  };

  const stop = async () => {
    if (!window.confirm("Are you sure you want to leave?")) return;
    window.location.href = `/${performer.username}`;
  };

  const modelLeftHandler = () => {
    if (showNotify) {
      message.info(
        `Stream ended. You will be redirected to the ${
          performer?.name || performer?.username
        } profile`,
        5
      );
      setShowNotify(false);
    }
    setStartTime(false);
    setTimeout(() => {
      window.location.href = `/${performer.username}`;
    }, 5000);
  };

  const modelJoinedHandler = () => {
    message.success(
      `${performer?.name || performer?.username} started private stream!`
    );
    setStartTime(true);
    if (startPay) {
      purchaseStream();
      setStartPay(false);
    }
  };

  const sendTip = async (token?: any) => {
    if (user.balance < token) {
      message.error("You have an insufficient wallet balance. Please top up.");
      window.location.href = "/wallet";

      return;
    }
    try {
      setSubmiting(true);
      await tokenTransctionService.sendTip(performer?._id, {
        price: token,
        conversationId: conversation?._id,
        sessionId: activeStream?.sessionId,
        streamType: "stream_private",
      });
      message.success("Thank you for the tip!");
      updateBalance({ token: -token });
    } catch (e) {
      const err = await e;
      message.error(err.message || "Error occurred, please try again later");
    } finally {
      setSubmiting(false);
    }
  };

  const showNotifyReject = () => {
    message.error(
      `${
        performer?.name || performer?.username
      } rejected your request. You you will redirect to profile model page in 5 seconds`,
      5
    );
    setTimeout(() => {
      window.location.href = `/${performer.username}`;
    }, 5000);
  };

  const showNotifyModelAcceptOtherRequest = () => {
    message.info(
      `${
        performer?.name || performer?.username
      } accepted a call with a different user. You will be redirected to ${
        performer?.name || performer?.username
      }'s profile in 5 seconds`,
      5
    );
    setTimeout(() => {
      window.location.href = `/${performer.username}`;
    }, 5000);
  };

  useEffect(() => {
    start();
    Router.events.on("routeChangeStart", onBeforeUnload);
    window && window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window && window.removeEventListener("beforeunload", onBeforeUnload);
      Router.events.off("routeChangeStart", onBeforeUnload);
    };
  }, []);

  useEffect(() => {
    socket && socket.on(STREAM_EVENT.MODEL_LEFT_PRIVATE, modelLeftHandler);
    socket && socket.on(STREAM_EVENT.MODEL_JOIN_PRIVATE, modelJoinedHandler);
    socket && socket.on(STREAM_EVENT.MODEL_REJECT_REQUEST, showNotifyReject);
    socket &&
      socket.on(
        STREAM_EVENT.MODEL_ACCEPT_REQUEST_USER,
        showNotifyModelAcceptOtherRequest
      );
    return () => {
      socket && socket.off(STREAM_EVENT.MODEL_LEFT_PRIVATE, modelLeftHandler);
      socket && socket.off(STREAM_EVENT.MODEL_JOIN_PRIVATE, modelJoinedHandler);
      socket && socket.off(STREAM_EVENT.MODEL_REJECT_REQUEST, showNotifyReject);
      socket &&
        socket.off(
          STREAM_EVENT.MODEL_ACCEPT_REQUEST_USER,
          showNotifyModelAcceptOtherRequest
        );
    };
  }, [socket]);

  useEffect(() => {
    if (startTime === true) {
      setTimeout(() => {
        setTokenSpent(tokenSpent + Number(performer.pricePerMinuteBookStream));
      }, 60000);
    }
    const walletElement = document.querySelector(".custom-wallet-number");
    if (walletElement) {
      walletElement.innerHTML = `$${tokenSpent.toFixed(2)}`;
    }
  }, [startTime, tokenSpent]);

  return (
    <AgoraProvider config={{ mode: "rtc", codec: "h264", role: "host" }}>
      <Row>
        <Col lg={16} md={16} xs={24}>
          <div className="stream-video">
            <ForwardedPublisher
              localUID={activeStream?.userId}
              remoteUID={activeStream?.performerId}
              ref={subscriberRef}
              sessionId={activeStream?.sessionId}
              conversationId={conversation?._id}
              eventName="private-stream/play"
            />
          </div>
          <div className="stream-duration">
            <div style={{ marginRight: 5 }}>
              <ClockCircleOutlined width={18} style={{ marginRight: 5 }} />
              <CallTime ref={callTimeRef} started={startTime} />
            </div>
            <div className="custom-wallet">
              ${(performer?.pricePerMinuteBookStream || 0).toFixed(2)} per
              minute
            </div>
            <div className="custom-wallet">
              <WalletIcon /> <span className="custom-wallet-number" />
            </div>
          </div>
          {initialized ? (
            <div className="buttons-stream">
              {/* <MuteButton type="publish" /> */}
              <div className="btntip-mobile">
                <Button
                  block
                  className="secondary"
                  disabled={submiting}
                  onClick={() => setOpenTipModal(true)}
                >
                  Send Tip
                </Button>
              </div>
            </div>
          ) : (
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
          )}
          <div
            className={
              !initialized
                ? "show-streaming-button"
                : "show-streaming-button stop-streaming"
            }
          >
            <>
              <Button key="start-btn" className="error" onClick={stop} block>
                Stop
              </Button>
            </>
          </div>
        </Col>
        <Col lg={8} md={8} xs={24}>
          <ChatBoxPublicStream
            user={user}
            activeConversation={activeConversation}
            performer={performer}
            activeStream={activeStream}
          />
        </Col>
      </Row>
      <Modal
        key="tip"
        centered
        title={null}
        visible={openTipModal}
        onOk={() => setOpenTipModal(false)}
        footer={null}
        onCancel={() => setOpenTipModal(false)}
        width={600}
      >
        <TipPerformerForm
          performer={performer}
          submiting={submiting}
          onFinish={sendTip.bind(this)}
        />
      </Modal>
    </AgoraProvider>
  );
}
UserPrivateStreamWapper.contextType = SocketContext;
export default UserPrivateStreamWapper;
