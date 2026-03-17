import {
  Button, Avatar
} from 'antd';
import { IUser } from '@interfaces/index';
import { TickIcon } from 'src/icons';
import './index.less';

interface IProps {
  message: any;
  onFinish: Function;
  submiting: boolean;
  performer: IUser;
}

function PurchaseMessageContentForm({
  onFinish, submiting, performer, message
}: IProps) {
  return (
    <div className="confirm-purchase-form">
      <div className="left-col">
        <Avatar src={performer?.avatar || '/static/no-avatar.png'} />
        <div className="p-name">
          {performer?.name || 'N/A'}
          {' '}
          {performer?.verifiedAccount && <TickIcon className="primary-color" />}
        </div>
        <div className="p-username">
          @
          {performer?.username || 'n/a'}
        </div>
        <img className="lock-icon" src="/static/lock-icon.png" alt="lock" />
      </div>
      <div className="right-col">
        <h2>
          Unlock Message Content
        </h2>
        <h3>
          {/* <span className="price">{(feed.price || 0).toFixed(2)}</span>
             */}
          <span className="price">{message.price}</span>
          {' '}
          USD
        </h3>
        <p className="description">
          {message.text}
        </p>
        <Button
          className="primary"
          disabled={submiting}
          loading={submiting}
          onClick={() => onFinish({ price: message.price })}
        >
          CONFIRM TO UNLOCK
        </Button>
      </div>
    </div>
  );
}

export default PurchaseMessageContentForm;
