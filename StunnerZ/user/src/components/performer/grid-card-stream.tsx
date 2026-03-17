import { PureComponent } from 'react';
import { IPerformer } from 'src/interfaces';
import { StarOutlined, EyeOutlined } from '@ant-design/icons';
import { ModelIcon, TickIcon } from 'src/icons';
import { short30Character, shortenLargeNumber } from '@lib/index';
import { connect } from 'react-redux';
import './performer.less';
import Link from 'next/link';
import { Button } from 'antd';
import { showSubscribePerformerModal } from '@redux/subscription/actions';
import Router from 'next/router';

interface IProps {
  performer: IPerformer;
  showSubscribePerformerModal: Function;
}

class PerformerGridCardStream extends PureComponent<IProps> {
  componentDidMount(): void {}

  handleRedirectToStream() {
    const {
      performer
    } = this.props;

    Router.push({
      pathname: '/streaming/details',
      query: {
        performer: JSON.stringify(performer),
        username: performer?.username || performer?._id
      }
    }, `/streaming/${performer?.username || performer?._id}`);
  }

  openSubscribe(event) {
    event.stopPropagation();
    const {
      performer,
      showSubscribePerformerModal: showModalSubPer
    } = this.props;
    if (!performer?.isSubscribed) {
      showModalSubPer(performer._id);
    }
  }

  render() {
    const { performer } = this.props;

    return (
      <div onClick={this.handleRedirectToStream} aria-hidden className="grid-card" style={{ backgroundImage: `url(${performer?.avatar || '/static/no-avatar.png'})` }}>
        {performer?.live > 0 ? <div className="live-status">Live</div> : <div>Offline</div>}
        <div className="card-stat-stream">
          <div className="card-stat-stream-content">
            <span>
              {shortenLargeNumber(performer?.score || 0)}
              {' '}
              <StarOutlined />
            </span>
            <span>
              <EyeOutlined />
              {' '}
              {shortenLargeNumber(performer?.liveInfo?.stats.members || 0)}
            </span>
          </div>
          <div className="card-stat-stream-content">
            <div className="card-stat-stream-icon">
              <ModelIcon />
            </div>
            <div className="">
              <Button type="primary" onClick={this.openSubscribe}>
                Subscribe
              </Button>
            </div>
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
const mapDispatch = {
  showSubscribePerformerModal
};
export default connect(maptStateToProps, mapDispatch)(PerformerGridCardStream);
