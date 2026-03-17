import { PureComponent } from 'react';
import { ICountry, IPerformer, IUser } from 'src/interfaces';
import { StarOutlined, EyeOutlined } from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import { short30Character, shortenLargeNumber } from '@lib/index';
import { connect } from 'react-redux';
import './performer.less';

interface IProps {
  performer: IPerformer;
  user: IUser;
  countries?: ICountry[];
  redirect: Function;
}

class PerformerGridCardLiveStream extends PureComponent<IProps> {
  componentDidMount(): void {}

  render() {
    const { performer, redirect } = this.props;
    return (
      <div onClick={() => redirect()} aria-hidden className="grid-card">
        <div className="gird-card-img" style={{ backgroundImage: `url(${performer?.avatar || '/static/no-avatar.png'})` }}>
          {performer?.live > 0 && <div className="live-status">{performer?.streamingStatus === 'private' ? 'Private' : 'Live'}</div>}
          <div className="card-stat">
            <span>
              {shortenLargeNumber(performer?.score || 0)}
              {' '}
              <StarOutlined />
            </span>
            <span>
              <EyeOutlined />
              {' '}
              {shortenLargeNumber((performer?.streamingStatus === 'private' ? 1 : performer?.liveInfo?.stats?.members) || 0)}
            </span>
          </div>
        </div>
          <div className="model-name">
            <div className="sentence">
              <span>
                {short30Character(performer?.liveInfo?.title || '')}
              </span>
            </div>

            <div className="sentence-username">
              {performer?.name || performer?.username || 'N/A'}
              {performer?.verifiedAccount && <TickIcon />}
            </div>
          </div>
      </div>
    );
  }
}

const maptStateToProps = (state) => ({ user: { ...state.user.current } });
export default connect(maptStateToProps)(PerformerGridCardLiveStream);
