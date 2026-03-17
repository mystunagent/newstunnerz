import { PureComponent } from 'react';
import {
  Input, Row, Col, Select, DatePicker
} from 'antd';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';

const { RangePicker } = DatePicker;
interface IProps {
  onSubmit?: Function;
  statuses?: {
    key: string;
    text?: string;
  }[];
  type?: {
    key: string;
    text?: string;
  }[];
  subscriptionTypes?: {
    key: string;
    text?: string;
  }[];
  searchWithPerformer?: boolean;
  searchWithKeyword?: boolean;
  dateRange?: boolean;
  isFree?: boolean;
  searchPayoutStatus?: boolean;
  // searchScheduleRange?: boolean;
}

export class SearchFilter extends PureComponent<IProps> {
  render() {
    const {
      statuses = [],
      type = [],
      searchWithPerformer,
      searchWithKeyword,
      dateRange,
      isFree,
      onSubmit,
      subscriptionTypes,
      searchPayoutStatus
      // searchScheduleRange
    } = this.props;
    return (
      <Row className="search-filter">
        {searchWithKeyword && (
          <Col lg={8} md={8} xs={12}>
            <Input
              placeholder="Enter keyword"
              onChange={(evt) => this.setState({ q: evt.target.value })}
              onPressEnter={() => onSubmit(this.state)}
            />
          </Col>
        )}
        {statuses && statuses.length ? (
          <Col lg={8} md={8} xs={12}>
            <Select
              onChange={(val) => this.setState({ status: val }, () => onSubmit(this.state))}
              style={{ width: '100%' }}
              placeholder="Select status"
              defaultValue=""
            >
              {statuses.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {type && type.length ? (
          <Col lg={8} md={8} xs={12}>
            <Select
              onChange={(val) => this.setState({ type: val }, () => onSubmit(this.state))}
              style={{ width: '100%' }}
              placeholder="Select type"
              defaultValue=""
            >
              {type.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {subscriptionTypes && subscriptionTypes.length ? (
          <Col lg={8} md={8} xs={12}>
            <Select
              onChange={(val) => this.setState({ subscriptionType: val }, () => onSubmit(this.state))}
              style={{ width: '100%' }}
              placeholder="Select type"
              defaultValue=""
            >
              {subscriptionTypes.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {searchWithPerformer && (
          <Col lg={8} md={8} xs={12}>
            <SelectPerformerDropdown
              placeholder="Search creator here"
              style={{ width: '100%' }}
              onSelect={(val) => this.setState({ performerId: val || '' }, () => onSubmit(this.state))}
            />
          </Col>
        )}
        {searchPayoutStatus && (
          <Col lg={6} md={8}>
            <Select
              defaultValue=""
              placeholder="Select paypout status"
              style={{ width: '100%' }}
              onChange={(val) => this.setState({ isPaid: val || '' }, () => onSubmit(this.state))}
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
          </Col>
        )}
        {dateRange && (
          <Col lg={8} md={8} xs={12}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates: [any, any], dateStrings: [string, string]) => this.setState({
                fromDate: dateStrings[0],
                toDate: dateStrings[1]
              }, () => onSubmit(this.state))}
            />
          </Col>
        )}
        {/* hide searchScheduleRange */}
        {/* {searchScheduleRange && (
          <Col lg={8} md={8} xs={12}>
            <h4>Date Schedule</h4>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates: [any, any], dateStrings: [string, string]) => this.setState({
                scheduleFrom: dateStrings[0],
                scheduleTo: dateStrings[1]
              }, () => onSubmit(this.state))}
            />
          </Col>
        )} */}
        {isFree && (
          <Col lg={8} md={8} xs={12}>
            <Select
              onChange={(val) => this.setState({ isFree: val }, () => onSubmit(this.state))}
              style={{ width: '100%' }}
              placeholder="Select type"
              defaultValue=""
            >
              <Select.Option key="" value="">
                All Type
              </Select.Option>
              <Select.Option key="free" value="true">
                Free
              </Select.Option>
              <Select.Option key="paid" value="false">
                Paid
              </Select.Option>
            </Select>
          </Col>
        )}
      </Row>
    );
  }
}
