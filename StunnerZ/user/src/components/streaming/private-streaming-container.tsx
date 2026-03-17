import ChatBox from '@components/stream-chat/chat-box';
import { getStreamConversationSuccess, resetStreamMessage } from '@redux/stream-chat/actions';
import { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { Button, Input, message } from 'antd';
import dynamic from 'next/dynamic';
import Router, { Router as RouterEvent } from 'next/router';
import {
  forwardRef, useContext, useEffect, useRef, useState
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SocketContext } from 'src/socket';
import './private-streaming-container.less';
import { LiveIcon, WalletIcon } from 'src/icons';
import { ClockCircleOutlined } from '@ant-design/icons';
import CallTime from './call-time';
import Price from './price';
import { MuteButton } from './mute-btn';

const AgoraProvider = dynamic(() => import('src/agora/AgoraProvider'), {
  ssr: false
});

const PrivateLiveStreaming = dynamic(
  () => import('@components/streaming/agora/private-live-streaming'),
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

export const STREAM_EVENT = {
  JOIN_BROADCASTER: 'join-broadcaster',
  LEFT_BROADCASTER: 'left-broadcaster',
  MODEL_LEFT: 'model-left',
  MODEL_JOIN_PRIVATE_CHAT: 'model-joined',
  MODEL_JOIN_PRIVATE: 'private-stream/model-join',
  MODEL_LEFT_PRIVATE: 'private-stream/model-left',
  USER_LEFT_PRIVATE: 'private-stream/user-left',
  USER_JOIN_PRIVATE: 'private-stream/user-join',
  MODEL_REJECT_REQUEST: 'reject_request_private_stream',
  MODEL_ACCEPT_REQUEST_USER: 'notify_and_redirect',
  ROOM_INFORMATIOM_CHANGED: 'public-room-changed',
  LEAVE_ROOM: 'public-stream/leave',
  JOIN_ROOM: 'public-stream/join',
  PRIVATE_JOIN_ROOM: 'private-stream/join',
  PRIVATE_LEAVE_ROOM: 'private-stream/leave',
  ADMIN_END_SESSION_STREAM: 'admin-end-session-stream'
};

interface IProps {
  activeStream: any;
  conversation: any;
}

function PerformerPrivateStream({ activeStream, conversation }: IProps) {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.current);

  const [initialized, setInitialized] = useState<boolean>(false);
  const publisherRef = useRef<{ publish: any; leave: any }>(null);
  const inputRef = useRef<any>(null);
  const callTimeRef = useRef(null);

  const { socket, connected } = useContext(SocketContext);

  const start = async () => {
    if (!publisherRef.current) return;
    dispatch(getStreamConversationSuccess({ data: conversation }));

    socket
      && socket.emit(STREAM_EVENT.PRIVATE_JOIN_ROOM, {
        conversationId: conversation._id
      });

    const clientInstance = (await publisherRef.current.publish()) as IAgoraRTCClient;

    setInitialized(true);

    clientInstance.on('user-published', (_user) => {
      if (_user.uid === activeStream.userId) {
        callTimeRef.current && callTimeRef.current.start();
      }
    });

    clientInstance.on('user-unpublished', () => {
      callTimeRef.current && callTimeRef.current.stop();
    });
  };

  const leave = () => {
    if (socket && conversation?._id) {
      socket.emit(STREAM_EVENT.PRIVATE_LEAVE_ROOM, {
        conversationId: conversation._id
      });
      dispatch(resetStreamMessage());
    }
  };

  const stop = async () => {
    if (!window.confirm('Are you sure you want to leave?')) return;

    Router.push(
      {
        pathname: '/[profileId]',
        query: { profileId: user?.username || user?._id }
      },
      `/${user?.username || user?._id}`
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userLeftHandler = ({ conversationId, broadcasterId }) => {
    if (
      conversation?._id !== conversationId
    ) {
      return;
    }
    message.info('Streaming session ended! Redirecting...', 5);
    Router.push(
      {
        pathname: '/[profileId]',
        query: { profileId: user?.username || user?._id }
      },
      `/${user?.username || user?._id}`
    );
  };

  const userJoinedHandler = async ({ broadcasterId, conversationId }) => {
    if (conversationId !== conversation?._id) return;
    if (broadcasterId && broadcasterId !== user._id) {
      message.success('User just started streaming!');
    }
  };

  useEffect(() => {
    const onBeforeUnload = () => leave();
    window && window.addEventListener('beforeunload', onBeforeUnload);
    RouterEvent.events.on('routeChangeStart', onBeforeUnload);

    return () => {
      window && window.removeEventListener('beforeunload', onBeforeUnload);
      RouterEvent.events.off('routeChangeStart', onBeforeUnload);
    };
  }, []);

  useEffect(() => {
    socket && socket.on(STREAM_EVENT.LEFT_BROADCASTER, userLeftHandler);
    socket && socket.on(STREAM_EVENT.JOIN_BROADCASTER, userJoinedHandler);
    return () => {
      socket && socket.off(STREAM_EVENT.LEFT_BROADCASTER, userLeftHandler);
      socket && socket.off(STREAM_EVENT.JOIN_BROADCASTER, userJoinedHandler);
    };
  }, [socket]);

  if (!connected()) return <div className="text-center">Initiating connection...</div>;

  return (
    <AgoraProvider config={{ mode: 'live', codec: 'h264', role: 'host' }}>
      <div className="page-streaming">
        <div className="page-streaming-left page-streaming-model">
          <div className="box-streaming-left">
            <div className="left-top-streaming">
              <div>
                <ClockCircleOutlined />
                <CallTime ref={callTimeRef} started={initialized} />
              </div>
              <div>
                <WalletIcon />
                <Price amount={user?.balance || 0} />
              </div>
            </div>
            {initialized ? (
              <div className="buttons-stream">
                <MuteButton type="publish" />
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
            <ForwardedPublisher
              localUID={activeStream?.performerId}
              remoteUID={activeStream?.userId}
              ref={publisherRef}
              conversationId={conversation?._id}
              sessionId={activeStream?.sessionId}
              eventName="private-stream/live"
            />
          </div>
          <div
            className={
              !initialized
                ? 'show-streaming-button'
                : 'show-streaming-button stop-streaming'
            }
          >
            <Input
              disabled={initialized}
              style={{ margin: '5px 0' }}
              defaultValue={10}
              ref={inputRef}
            />
            {!initialized ? (
              <Button key="start-btn" className="success" onClick={start} block>
                Start
              </Button>
            ) : (
              <Button key="start-btn" className="error" onClick={stop} block>
                Stop
              </Button>
            )}
            {initialized && (
              <button type="button" className="stop-stream-mobile" onClick={stop}>
                X
              </button>
            )}
          </div>
        </div>
        <div className="page-streaming-right">
          <ChatBox
            user={user}
            activeConversation={initialized ? conversation : null}
          />
        </div>
      </div>
    </AgoraProvider>
  );
}

export default PerformerPrivateStream;
