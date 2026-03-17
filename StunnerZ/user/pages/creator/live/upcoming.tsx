/* eslint-disable dot-notation */
import React, { PureComponent, createRef, forwardRef } from 'react';
import Head from 'next/head';
import {
  Row, Col, Button, message, Layout, Card
} from 'antd';
import {
  ClockCircleOutlined, PlayCircleOutlined, EditOutlined, EyeOutlined,
  StopOutlined
} from '@ant-design/icons';
import { connect } from 'react-redux';
import {
  IPerformer, IUIConfig, IUser, StreamSettings, IStream
} from 'src/interfaces';
import { messageService, streamService } from 'src/services';
import { SocketContext, Event } from 'src/socket';
import {
  getStreamConversation, resetStreamMessage, resetAllStreamMessage
} from '@redux/stream-chat/actions';
import Router, { Router as RouterEvent } from 'next/router';
import { videoDuration } from '@lib/index';
import dynamic from 'next/dynamic';
import './index.less';
import { upcomingStreamService } from '@services/upcoming-stream.service';
import ChatBoxPublicStream from '@components/stream-chat/chat-box-public';

const AgoraProvider = dynamic(() => import('src/agora/AgoraProvider'), { ssr: false });
const Publisher = dynamic(() => import('@components/streaming/agora/publisher'), { ssr: false });
const ForwardedPublisher = forwardRef((props: {
  uid: string,
  onStatusChange: Function,
  conversationId: string;
  sessionId: string;
}, ref) => <Publisher {...props} forwardedRef={ref} />);

// eslint-disable-next-line no-shadow
enum EVENT_NAME {
  ROOM_INFORMATIOM_CHANGED = 'public-room-changed',
  ROOM_EARNING_CHANGED = 'public-earning-changed',
  ADMIN_END_SESSION_STREAM = 'admin-end-session-stream',
  LEAVE_STREAM = 'public-stream/leave'
}

interface IProps {
  ui: IUIConfig;
  settings: StreamSettings;
  resetStreamMessage: Function;
  resetAllStreamMessage: Function;
  getStreamConversation: Function;
  activeConversation: any;
  user: IPerformer;
  params: any;
}

interface IStates {
  loading: boolean;
  initialized: boolean;
  total: number;
  members?: IUser[];
  callTime: number;
  activeStream: IStream;
  editting: boolean;
  earningStream: number;
  dataUpcomingStream: any;
  isStreamEndWarningShown: boolean;
}

class PerformerUpcomingLivePage extends PureComponent<IProps, IStates> {
  static layout = 'stream';

  static authenticate = true;

  static async getInitialProps({ ctx }) {
    return {
      params: ctx.query
    };
  }

  private publisherRef = createRef<{ publish: any, leave: any }>();

  private streamDurationTimeOut: any;

  private setDurationStreamTimeOut: any;

  private descriptionRef = createRef<any>();

  state = {
    loading: false,
    initialized: false,
    total: 0,
    callTime: 0,
    activeStream: null,
    editting: false,
    earningStream: 0,
    dataUpcomingStream: null,
    isStreamEndWarningShown: false
  };

  componentDidMount() {
    const { user, params } = this.props;
    if(user?.infoSubPerformer?._id && !user?.infoBankSubPerformer){
      Router.push('/');
      return;
    }
    if (user?.infoSubPerformer?._id && (!user?.infoSubPerformer?.privilege.includes('all') && !user?.infoSubPerformer?.privilege.includes('streaming'))) {
      Router.push('/');
      return;
    }
    if (!user || !user.completedAccount) {
      message.warning('Your account is not completed, please go to your profile to complete it or contact with admin for more detail');
      Router.back();
      return;
    }
    if (params && params.upcomingId) {
      this.loadDataUpcomingStream();
    }
    window.addEventListener('beforeunload', this.onbeforeunload.bind(this));
    RouterEvent.events.on('routeChangeStart', this.onbeforeunload.bind(this));
  }

  componentDidUpdate(prevProps, prevState) {
    const { user } = this.props;
    const { dataUpcomingStream, isStreamEndWarningShown } = this.state;
    if(!!dataUpcomingStream){
      const currentDate = new Date();
      const endAtDate = new Date(dataUpcomingStream?.endAt);
      const timeRemaining = endAtDate.getTime() - currentDate.getTime();
      console.log(timeRemaining);
      if(timeRemaining <= 70000 && timeRemaining > 0 && !isStreamEndWarningShown){  //before 1 minute
        message.info('The stream about to end in next 1 Min');
        this.setState({ isStreamEndWarningShown: true });
      }
      if(currentDate.getFullYear() === endAtDate.getFullYear() &&
      currentDate.getMonth() === endAtDate.getMonth() &&
      currentDate.getDate() === endAtDate.getDate() &&
      currentDate.getHours() === endAtDate.getHours() &&
      currentDate.getMinutes() === endAtDate.getMinutes()){
        Router.push({ pathname: '/creator/profile', query: { username: user?.username || user?._id } }, `/${user?.username || user?._id}`);
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload.bind(this));
    RouterEvent.events.off('routeChangeStart', this.onbeforeunload.bind(this));
  }

  // eslint-disable-next-line react/sort-comp
  handleDuration() {
    const { callTime } = this.state;
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    this.setState({ callTime: callTime + 1 });
    this.streamDurationTimeOut = setTimeout(this.handleDuration.bind(this), 1000);
  }

  onRoomChange = ({ total, conversationId }) => {
    const { activeConversation } = this.props;
    const { activeStream } = this.state;
    if (activeConversation?.data?._id && activeConversation.data._id === conversationId) {
      this.setState({ total });
      if (activeStream) {
        this.getTotalPurchasedStream(activeStream);
      }
    }
  }

  onChangeEarnings({ totalPurchasedEarning }) {
    const { activeStream } = this.state;
    if (totalPurchasedEarning && activeStream && activeStream) {
      this.setState({ earningStream: totalPurchasedEarning * (activeStream?.price || 0) });
    }
  }

  getTotalPurchasedStream = async (activeStream: IStream) => {
    try {
      const resp = await streamService.searchLive(activeStream._id);
      this.setState({
        earningStream: (resp?.data?.totalPurchased || 0) * activeStream.price
      });
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Error occurred please try again');
    }
  }

  onStreamStatusChange = (started: boolean) => {
    if (started) {
      this.setState({ initialized: true, loading: false });
      this.handleDuration();
      this.updateStreamDuration();
    } else {
      this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
      this.setDurationStreamTimeOut && clearTimeout(this.setDurationStreamTimeOut);
      this.setState({ loading: false });
    }
  }

  onbeforeunload = () => {
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    this.setDurationStreamTimeOut && clearTimeout(this.setDurationStreamTimeOut);
    this.leavePublicRoom();
  }

  async loadDataUpcomingStream() {
    const { params } = this.props;
    try {
      const { data } = await upcomingStreamService.details(params?.upcomingId);
      this.setState({ dataUpcomingStream: data });
    } catch (error) {
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  }

  async joinPublicRoom(dataUpcomingStream) {
    const { getStreamConversation: dispatchGetStreamConversation } = this.props;
    const socket = this.context;
    const payload = !!dataUpcomingStream && {
      upcoming: true,
      upcomingId: dataUpcomingStream?._id,
      title: dataUpcomingStream.title,
      description: 'upcoming',
      isFree: dataUpcomingStream.isFree,
      price: dataUpcomingStream.price,
      optionStream: dataUpcomingStream.optionStream
    };
    try {
      this.setState({ loading: true });
      const resp = await (await streamService.goLive(payload)).data;
      this.setState({
        activeStream: resp
      });
      dispatchGetStreamConversation({
        conversation: resp.conversation
      });
      socket && socket.emit('public-stream/join', {
        conversationId: resp.conversation._id
      });
      this.publisherRef.current && this.publisherRef.current.publish();
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Stream server error, please try again later');
    }
  }

  async leavePublicRoom() {
    const { activeConversation, resetStreamMessage: reset } = this.props;
    const socket = this.context;
    const conversation = { ...activeConversation.data };
    if (socket && conversation && conversation._id) {
      socket.emit(EVENT_NAME.LEAVE_STREAM, { conversationId: conversation._id });
      await messageService.deleteAllMessageInConversation(conversation?._id);
      reset();
    }
  }

  async updateStreamDuration() {
    this.setDurationStreamTimeOut && clearTimeout(this.setDurationStreamTimeOut);
    const { callTime, activeStream } = this.state;
    if (!activeStream) return;
    await streamService.updateStreamDuration({ streamId: activeStream._id, duration: callTime });
    this.setDurationStreamTimeOut = setTimeout(this.updateStreamDuration.bind(this), 15 * 1000);
  }

  async editLive() {
    try {
      const { activeStream } = this.state;
      if (!activeStream) return;
      const description = this.descriptionRef.current.value;
      await streamService.editLive(activeStream._id, { description });
      this.setState({ activeStream: { ...activeStream, description } });
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Stream server error, please try again later');
    } finally {
      this.setState({ editting: false });
    }
  }

  async handleStopStream(user, params) {
    if (!window.confirm('Are you sure to stop this stream ?')) return;
    await streamService.removeAllRequest();
    window.location.href = `/${user?.username}`;
    // Router.push({ pathname: '/creator/profile', query: { username: user?.username || user?._id } }, `/${user?.username || user?._id}`);
    // await streamService.removeAllRequest();
    // try {
    //   if(params) {
    //     await upcomingStreamService.updateStatus(params?.upcomingId);
    //   }
    // } catch (error) {
    //   const e = await error;
    //   message.error(e.message || 'An error occurred');
    // }
  };

  render() {
    const { user, ui, params } = this.props;
    const {
      loading, initialized, total, callTime,
      activeStream, editting, earningStream, dataUpcomingStream
    } = this.state;

    return (
      <AgoraProvider config={{ mode: 'live', codec: 'h264', role: 'host' }}>
        <Layout>
          <Head>
            <title>
              {`${ui?.siteName} | Live Upcoming`}
            </title>
          </Head>
          <Event
            event={EVENT_NAME.ROOM_INFORMATIOM_CHANGED}
            handler={this.onRoomChange.bind(this)}
          />
          <Event
            event={EVENT_NAME.ROOM_EARNING_CHANGED}
            handler={this.onChangeEarnings.bind(this)}
          />
          <div>
            <Row className="main-container">
              <Col xs={24} sm={24} md={16} style={{ padding: 10 }}>
                <ForwardedPublisher
                  uid={user._id}
                  onStatusChange={(val) => this.onStreamStatusChange(val)}
                  ref={this.publisherRef}
                  conversationId={activeStream?.conversation?._id}
                  sessionId={activeStream?.sessionId}
                />
                <p className="stream-duration">
                  <span>
                    <ClockCircleOutlined />
                    {' '}
                    {videoDuration(callTime)}
                  </span>
                  <span>
                    $
                    {(earningStream).toFixed(2)}
                  </span>
                  <span>
                    <EyeOutlined />
                    {' '}
                    {total}
                  </span>
                </p>
                <div className="stream-description">
                  {!initialized ? (
                    <Button
                      key="start-btn"
                      className="primary"
                      onClick={() => this.joinPublicRoom(dataUpcomingStream)}
                      disabled={loading}
                      loading={loading}
                      block
                    >
                      <PlayCircleOutlined />
                      {' '}
                      Start Broadcasting
                    </Button>
                  ) : (
                    <Button
                      key="start-btn"
                      className="primary"
                      onClick={() => this.handleStopStream(user, params)}
                      disabled={loading}
                      block
                    >
                      <StopOutlined />
                      {' '}
                      Stop Broadcasting
                    </Button>
                  )}
                </div>
                <Card bordered={false} bodyStyle={{ padding: 0 }}>
                  <Card.Meta
                    title={activeStream?.title}
                    description={activeStream?.description && (
                      <p>
                        {editting ? (
                          <Row>
                            <Col xs={24}>
                              <textarea className="ant-input" ref={this.descriptionRef} defaultValue={activeStream.description} />
                            </Col>
                            <Col xs={24}>
                              <Button className="primary" icon={<EditOutlined />} onClick={() => this.editLive()}>Update</Button>
                            </Col>
                          </Row>
                        ) : (
                          <>
                            {activeStream.description}
                            {' '}
                            <EditOutlined onClick={() => this.setState({ editting: true })} />
                          </>
                        )}
                      </p>
                    )}
                  />

                </Card>
              </Col>
              <Col xs={24} sm={24} md={8} style={{ padding: 10 }}>
                <ChatBoxPublicStream
                  {...this.props}
                />
              </Col>
              {/* <Modal
                centered
                key="update_stream"
                title="Update stream information"
                visible={openPriceModal}
                footer={null}
                onCancel={() => this.setState({ openPriceModal: false })}
              >
                <StreamPriceForm
                  submiting={loading}
                  performer={user}
                  onFinish={this.joinPublicRoom.bind(this)}
                  dataUpcomingStream={dataUpcomingStream}
                />
              </Modal> */}
            </Row>
          </div>
        </Layout>
      </AgoraProvider>
    );
  }
}

PerformerUpcomingLivePage.contextType = SocketContext;

const mapStateToProps = (state) => ({
  ui: { ...state.ui },
  ...state.streaming,
  user: { ...state.user.current },
  activeConversation: { ...state.streamMessage.activeConversation }
});
const mapDispatchs = {
  getStreamConversation,
  resetStreamMessage,
  resetAllStreamMessage
};
export default connect(mapStateToProps, mapDispatchs)(PerformerUpcomingLivePage);
