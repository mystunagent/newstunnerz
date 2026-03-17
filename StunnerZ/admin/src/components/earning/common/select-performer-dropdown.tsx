import { PureComponent } from 'react';
import { Select } from 'antd';

interface IProps {
  placeholder: string;
  style?: Record<string, string>;
  onSelect: Function;
}

export class SelectStatusIsPaid extends PureComponent<IProps> {
  state = {
    defaultValue: ''
  };

  render() {
    const {
      style, onSelect, placeholder
    } = this.props;
    const { defaultValue } = this.state;
    return (
      <>
        <Select
          defaultValue={defaultValue}
          placeholder={placeholder}
          style={style}
          onChange={(val) => onSelect(val)}
          optionFilterProp="children"
        >
          <Select.Option key="default" value="">
            All payout status
          </Select.Option>
          <Select.Option key="paid" value="true">
            Paid
          </Select.Option>
          <Select.Option key="unPaid" value="false">
            UnPaid
          </Select.Option>
        </Select>
      </>
    );
  }
}
