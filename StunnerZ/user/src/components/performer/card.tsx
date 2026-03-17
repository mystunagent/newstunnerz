import { PureComponent } from 'react';
import { Avatar, message, Tooltip } from 'antd';
import { TickIcon } from 'src/icons';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { IPerformer, ICountry, IUser } from 'src/interfaces';
import Link from 'next/link';
import { connect } from 'react-redux';
import Router from 'next/router';
import {
  authService, followService, streamService
} from 'src/services';
import { showSubscribePerformerModal } from '@redux/subscription/actions';

import './performer.less';

interface IProps {
  performer: IPerformer;
  countries: ICountry[];
  user: IUser;
  onFollow?: Function;
  showSubscribePerformerModal: Function;
}

class PerformerCard extends PureComponent<IProps> {
  state = {
    isFollowed: false,
    requesting: false,
    optionStream: null
  };

  componentDidMount(): void {
    const { performer, user } = this.props;
    this.setState({ isFollowed: !!performer?.isFollowed });
    // if (user && user._id && performer && performer?.live > 0) {
    //   this.checkOptionStream(performer);
    // }
  }

  // checkOptionStream = async (performer: IPerformer) => {
  //   const { user } = this.props;
  //   if (!user._id) {
  //     message.error('Please login before');
  //   }
  //   try {
  //     const token = authService.getToken();
  //     const headers = { Authorization: token };
  //     const stream = await streamService.joinPublicChat(performer._id, headers);
  //     this.setState({ optionStream: stream?.data?.optionStream || null });
  //   } catch (e) {
  //     // etc
  //   }
  // }

  handleJoinStream = (e) => {
    e.preventDefault();
    const {
      user, performer,
      showSubscribePerformerModal: showModalSubPer
    } = this.props;
    const { optionStream } = this.state;
    if (!user._id) {
      message.error('Please log in or register!');
      return;
    }
    if (user.isPerformer) return;
    if(performer?.streamingStatus === 'private') {
      message.error(`${performer?.name || performer?.username} is currently in a private stream. Please try again later.`, 5);
      return;
    }
    if (optionStream === 'subscribe' && !performer?.isSubscribed) {
      message.error('Please subscribe to join live chat!');
      showModalSubPer(performer._id);
      return;
    }
    Router.push({
      pathname: '/streaming/details',
      query: {
        performer: JSON.stringify(performer),
        username: performer?.username || performer?._id
      }
    }, `/streaming/${performer?.username || performer?._id}`);
  }

  handleFollow = async () => {
    const { performer, user, onFollow } = this.props;
    const { isFollowed, requesting } = this.state;
    if (requesting || user.isPerformer) return;
    if (!user._id) {
      message.error('Please log in or register!');
      return;
    }
    try {
      this.setState({ requesting: true });
      if (!isFollowed) {
        await followService.create(performer?._id);
        this.setState({ isFollowed: true, requesting: false });
        message.success('Followed successfully');
      } else {
        await followService.delete(performer?._id);
        this.setState({ isFollowed: false, requesting: false });
        message.success('Unfollowed successfully');
      }
      onFollow && onFollow();
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ requesting: false });
    }
  };

  render() {
    const { performer, countries, user } = this.props;
    const { isFollowed } = this.state;
    const country = countries && countries.length && countries.find((c) => c.code === performer.country);

    return (
      <div
        className="model-card"
        style={{
          backgroundImage: `url(${performer?.cover || '/static/banner-image.jpg'})`
        }}
      >
        <div className="hovering">
          {performer?.isFreeSubscription && (
            <span className="card-free">Free</span>
          )}
          {performer?.live > 0 && <span className="live-status" aria-hidden onClick={this.handleJoinStream.bind(this)}>Live</span>}
          <div className="card-img">
            <Avatar alt="avatar" src={performer?.avatar || '/static/no-avatar.png'} />
          </div>
          <span className={performer?.isOnline > 0 ? 'online-status active' : 'online-status'} />
          <Link
            href={{
              pathname: '/creator/profile',
              query: { username: performer?.username || performer?._id }
            }}
            as={`/${performer?.username || performer?._id}`}
          >
            <a>
              {performer?.isFreeSubscription && (
                <div className="card-stat">
                  <span>Free</span>
                </div>
              )}
              {country && (
                <span className="card-country">
                  <img alt="performer-country" src={country?.flag} />
                </span>
              )}
              <div className="card-img">
                <Avatar alt="avatar" src={performer?.avatar || '/static/no-avatar.png'} />
              </div>
              <span className={performer?.isOnline > 0 ? 'online-status active' : 'online-status'} />
              <div className="model-name">
                <div className="name">
                  {performer?.name || 'N/A'}
                  {' '}
                  {country && (
                    <img alt="performer-country" className="model-country" src={country?.flag} />
                  )}
                  {' '}
                  {performer?.verifiedAccount && <TickIcon />}
                </div>
                <p>
                  {`@${performer?.username || 'n/a'}`}
                </p>
              </div>

            </a>
          </Link>
          {!user?.isPerformer && (
            <a aria-hidden onClick={() => this.handleFollow()} className={!isFollowed ? 'follow-btn' : 'follow-btn active'}>
              {isFollowed ? <Tooltip title="Following"><HeartFilled /></Tooltip> : <Tooltip title="Follow"><HeartOutlined /></Tooltip>}
            </a>
          )}
        </div>
      </div>
    );
  }
}

const maptStateToProps = (state) => ({ user: { ...state.user.current } });

const mapDispatch = {
  showSubscribePerformerModal
};
export default connect(maptStateToProps, mapDispatch)(PerformerCard);
