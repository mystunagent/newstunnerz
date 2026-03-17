import { PureComponent } from 'react';
import { Select, message, Avatar } from 'antd';
import { debounce } from 'lodash';
import { performerService } from '@services/performer.service';

interface IProps {
  placeholder?: string;
  style?: Record<string, string>;
  onSelect: (selectedIds: string[]) => void;
  defaultValue?: string[];
  disabled?: boolean;
  showAll?: boolean;
}

interface IState {
  loading: boolean;
  data: any[];
  isFirstLoaded: boolean;
  defaultPerformers: any[];
}

export class SelectMultiPerformerDropdown extends PureComponent<IProps, IState> {
  state: IState = {
    loading: false,
    data: [],
    isFirstLoaded: false,
    defaultPerformers: []
  };

  loadPerformers = debounce(async (q) => {
    try {
      await this.setState({ loading: true });
      const resp = await (await performerService.search({ q, limit: 99, role: 'performer' })).data;
      this.setState({
        data: resp.data,
        loading: false,
        isFirstLoaded: true
      });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occurred');
      this.setState({ loading: false, isFirstLoaded: true });
    }
  }, 500);

  async componentDidMount() {
    await this.loadDefaultPerformers();
    this.loadPerformers('');
  }

  loadDefaultPerformers = async () => {
    const { defaultValue } = this.props;
    const defaultPerformers = await Promise.all(
      defaultValue.map(async (id) => {
        console.log(id);
        const performer = await performerService.findById(id);
        return performer.data;
      })
    );
    this.setState({ defaultPerformers });
  };

  handleSelect = (selectedIds: string[]) => {
    const { onSelect } = this.props;
    onSelect(selectedIds);
  };

  render() {
    const { style, defaultValue = [], disabled, showAll } = this.props;
    const { data, loading, isFirstLoaded, defaultPerformers } = this.state;
    const performerId = defaultPerformers.filter((u) => u._id).map((a) => a._id);
    return (
      <>
        {isFirstLoaded && (
          <Select
            showSearch
            mode="multiple"
            defaultValue={performerId}
            placeholder="Type to search model here"
            style={style}
            onSearch={this.loadPerformers.bind(this)}
            onChange={this.handleSelect}
            loading={loading}
            optionFilterProp="children"
            disabled={disabled}
          >
            <Select.Option value="" key="default" disabled={showAll}>
              {showAll ? 'Select a model' : 'All models'}
            </Select.Option>
            {data.map((u) => (
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