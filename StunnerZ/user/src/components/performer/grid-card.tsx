import { PureComponent } from 'react';
import { ICountry, IPerformer, IUser } from 'src/interfaces';
import Link from 'next/link';
import { StarOutlined, HeartFilled, HeartOutlined } from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import { short30Character, shortenLargeNumber } from '@lib/index';
import { connect } from 'react-redux';
import { message, Tooltip } from 'antd';
import { followService } from 'src/services';
import './performer.less';
import Router from 'next/router';

interface IProps {
  performer: IPerformer;
  user: IUser;
  countries?: ICountry[];
}

class PerformerGridCard extends PureComponent<IProps> {
  state = {
    isFollowed: false,
    requesting: false
  }

  componentDidMount(): void {
    const { performer } = this.props;
    this.setState({ isFollowed: !!performer?.isFollowed });
  }

  handleFollow = async (event: any) => {
    event.stopPropagation();
    const { performer, user } = this.props;
    const { isFollowed, requesting } = this.state;
    if (!user._id) {
      message.error('Please log in or register!');
      return;
    }
    if (requesting || user.isPerformer) return;
    try {
      this.setState({ requesting: true });
      if (!isFollowed) {
        await followService.create(performer?._id);
        this.setState({ isFollowed: true, requesting: false });
      } else {
        await followService.delete(performer?._id);
        this.setState({ isFollowed: false, requesting: false });
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ requesting: false });
    }
  }

  handleToProfile = (e) => {
    const { performer } = this.props;
    e.preventDefault();
    Router.push({
      pathname: '/creator/profile',
      query: { username: performer?.username || performer?._id }
    }, `/${performer?.username || performer?._id}`);
  }

  render() {
    const { performer, user } = this.props;
    const { isFollowed } = this.state;

    return (
      <div onClick={this.handleToProfile} aria-hidden className="grid-card" style={{ backgroundImage: `url(${performer?.avatar || '/static/no-avatar.png'})` }}>
        {/* {performer?.isFreeSubscription && <span className="free-status">Free</span>} */}
        <span className={performer?.isOnline > 0 ? 'online-status active' : 'online-status'} />
        {performer?.live > 0 && <div className="live-status">Live</div>}
        {!user?.isPerformer && (
          <a aria-hidden onClick={this.handleFollow} className={!isFollowed ? 'follow-btn' : 'follow-btn active'}>
            {isFollowed ? <Tooltip title="Following"><HeartFilled /></Tooltip> : <Tooltip title="Follow"><HeartOutlined /></Tooltip>}
          </a>
        )}
        <div className="card-stat">
          <span>
            {shortenLargeNumber(performer?.score || 0)}
            {' '}
            <StarOutlined />
          </span>
          {/* {performer?.dateOfBirth && (
            <span>
              {dobToAge(performer?.dateOfBirth)}
            </span>
          )} */}
        </div>
        <Link
          href={{
            pathname: '/creator/profile',
            query: { username: performer?.username || performer?._id }
          }}
          as={`/${performer?.username || performer?._id}`}
        >
          <a>
            <div className="model-name">
              <div className="sentence">
                <span>
                  {short30Character(performer?.sentence || '')}
                </span>
              </div>

              <div className="sentence-username">
                {performer?.name || performer?.username || 'N/A'}
                {performer?.verifiedAccount && <TickIcon />}
              </div>
            </div>

          </a>
        </Link>
      </div>
    );
  }
}

const maptStateToProps = (state) => ({ user: { ...state.user.current } });
export default connect(maptStateToProps)(PerformerGridCard);
