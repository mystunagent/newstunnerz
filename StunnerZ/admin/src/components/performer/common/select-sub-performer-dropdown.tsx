import { PureComponent } from 'react';
import { Select, message, Avatar } from 'antd';
import { debounce } from 'lodash';
import { performerService } from '@services/performer.service';
import { userService } from '@services/user.service';

interface IProps {
  placeholder?: string;
  state?: any;
  style?: Record<string, string>;
  onSelect: Function;
  defaultValue?: string;
  disabled?: boolean;
  showAll?: boolean;
}

export class SelectSubPerformerDropdown extends PureComponent<IProps> {
  state = {
    loading: false,
    data: [],
    isFirstLoaded: false,
    state: {}
  };

  loadAgencies = debounce(async (q) => {
    const { state } = this.props;
    try {
      if(state === 'all') {
        return;
      }
      this.setState({ loading: true });
      let resp;
      if(state) {
        resp = await (await userService.searchSubAccount({ q, limit: 10, performerId: state }))?.data;
      } else {
        resp = await (await userService.searchSubAccount({ q, limit: 10 }))?.data;
      }
      this.setState({
        data: resp.data,
        loading: false,
        isFirstLoaded: true
      });
    } catch (e) {
      const err = await e;
      this.setState({ loading: false, isFirstLoaded: true });
    }
  }, 500);

  componentDidMount() {
    this.loadAgencies('');
  }
  
  componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<{}>, snapshot?: any): void {
    if(prevProps.state !== this.props.state) {
      this.loadAgencies('');
    }
  }

  render() {
    const {
      style, onSelect, defaultValue, disabled, showAll
    } = this.props;
    const { data, loading, isFirstLoaded } = this.state;
    const { state } = this.props;
    return (
      <>
        {isFirstLoaded && (
        <Select
          showSearch
          defaultValue={defaultValue}
          placeholder="Type to search agency here"
          style={style}
          onSearch={this.loadAgencies.bind(this)}
          onChange={(val) => onSelect(val)}
          loading={loading}
          optionFilterProp="children"
          disabled={disabled}
        >
          <Select.Option value="" key="default" disabled={showAll}>
            {showAll ? 'Select a model' : 'All agency'}
          </Select.Option>
          {data && data.length > 0 && data.map((u) => (
            <Select.Option value={u._id} key={u._id} style={{ textTransform: 'capitalize' }}>
              <Avatar size={28} src={u?.avatar || '/no-avatar.png'} />
              {' '}
              {`${u?.name || u?.username || 'no_name'}`}
            </Select.Option>
          ))}
        </Select>
        )}
      </>
    );
  }
}
