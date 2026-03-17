import './advertise.less';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { CloseOutlined } from '@ant-design/icons';

type IProps = {
  settings: any
  hiddenComponent: boolean;
  onclose: Function;
}

function AdvertiseForm({ settings, hiddenComponent, onclose }: IProps) {
  return (
    <>
      <div className={classNames(`${'advertise'} ${hiddenComponent ? 'hidden-container' : ''}`)}>
        <div className="advertise-content">
          <div className="advertise-content-title">
            <span>{settings?.advertiseContent}</span>
          </div>
          <div
            className="advertise-content-close"
            onClick={() => onclose()}
            aria-hidden
          >
            <span><CloseOutlined /></span>
          </div>
        </div>
      </div>
    </>
  );
}
const mapStates = (state: any) => ({
  settings: { ...state.settings }
});

export default connect(mapStates)(AdvertiseForm);
