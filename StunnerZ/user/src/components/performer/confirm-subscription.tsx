import {
  Button, Avatar
} from 'antd';
import { IPerformer, ISettings, IUIConfig } from 'src/interfaces';
import {
  CheckSquareOutlined
} from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import './performer.less';

interface IProps {
  settings: ISettings;
  type: string;
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
  ui: IUIConfig;
}

const ConfirmSubscriptionPerformerForm = ({
  performer, type, settings, onFinish, submiting, ui
}: IProps) => {
  const convertPrice = () => {
    const cost = (settings?.transactionCost || 0.04);
    switch (type) {
      case 'monthly': return (performer.monthlyPrice * (1 + cost)).toFixed(2);
      case 'six_month': return (performer.sixMonthPrice * (1 + cost)).toFixed(2);
      case 'one_time': return (performer.oneTimePrice * (1 + cost)).toFixed(2);
      case 'trial': return (performer.trialPrice * (1 + cost)).toFixed(2);
      default: return 0;
    }
  };

  const desc = () => {
    switch (type) {
      case 'monthly': return ' USD/month';
      case 'six_month': return ' USD/6 months';
      case 'one_time': return ' USD';
      case 'trial': return ` USD in ${performer?.durationTrialSubscriptionDays} ${performer?.durationTrialSubscriptionDays > 1 ? 'days' : 'day'}`;
      default: return '';
    }
  };

  return (
    <div className="confirm-purchase-form">
      <div className="left-col hide-lef--col-mobile">
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
        <img className="lock-icon" src={ui?.logo} alt="logo" />
      </div>
      <div className="right-col">
        <h2>
          Subscribe
          {' '}
          <span className="username">{`${performer?.name}` || 'the creator'}</span>
        </h2>
        <h3>
          <span className="price">{convertPrice()}</span>
          {desc()}
        </h3>
        <ul className="check-list">
          <li>
            <CheckSquareOutlined />
            {' '}
            Full access to this creator&apos;s exclusive content
          </li>
          <li>
            <CheckSquareOutlined />
            {' '}
            Direct message with this creator
          </li>
          <li>
            <CheckSquareOutlined />
            {' '}
            Requested personalised Pay Per View content
          </li>
          <li>
            <CheckSquareOutlined />
            {' '}
            Cancel your subscription at any time
          </li>
          {type === 'trial' && (
            <li>
              <CheckSquareOutlined />
              {' '}
              After the trial period, monthly subscription will be charged
            </li>
          )}
        </ul>
        <Button
          className="primary"
          disabled={submiting}
          loading={submiting}
          onClick={() => onFinish()}
        >
          SUBSCRIBE
        </Button>
        <p className="text-center"><small>(Included transaction cost)</small></p>
        <p className="sub-text">Clicking &quot;Subscribe&quot; will take you to the payment screen to finalize your subscription</p>
      </div>
    </div>
  );
};

export default ConfirmSubscriptionPerformerForm;
