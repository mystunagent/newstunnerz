import { PureComponent } from 'react';
import {
  Input, Row, Col, Select, DatePicker
} from 'antd';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { SelectGalleryDropdown } from '@components/gallery/common/select-gallery-dropdown';
import { SelectStatusIsPaid } from '@components/earning/common/select-performer-dropdown';
import { SelectSubPerformerDropdown } from '@components/performer/common/select-sub-performer-dropdown';
import { SelectPerformerDropdownForPayment } from '@components/performer/common/select-performer-payment-dropdown';

const { RangePicker } = DatePicker;
interface IProps {
  keyword?: boolean;
  onSubmit?: Function;
  keyFilter?: string;
  statuses?: {
    key: string;
    text?: string;
  }[];
  sourceType?: {
    key: string;
    text?: string;
  }[];
  type?: {
    key: string;
    text?: string;
  }[];
  defaultType?: string;
  defaultStatus?: string;
  searchWithPerformer?: boolean;
  searchWithSubPerformer?: boolean;
  performerId?: string;
  searchWithGallery?: boolean;
  galleryId?: string;
  dateRange?: boolean;
  searchPayoutStatus?: boolean;
  searchLatestPayment?: boolean;
  searchWithPerformerPayment?: boolean;
}

export class SearchFilter extends PureComponent<IProps> {
  state = {
    perId: '',
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.perId !== this.state.perId) {
      this.setState({
        perId: this.state.perId
      });
    }
  }
  render() {
    const { onSubmit } = this.props;
    const { perId } = this.state;
    const {
      statuses = [],
      searchWithPerformer,
      performerId,
      galleryId,
      searchWithGallery,
      keyFilter,
      dateRange,
      sourceType,
      keyword,
      type,
      defaultType,
      defaultStatus,
      searchPayoutStatus,
      searchLatestPayment,
      searchWithSubPerformer,
      searchWithPerformerPayment
    } = this.props;
    return (
      <Row gutter={24}>
        {keyword ? (
          <Col lg={6} md={8}>
            <Input
              placeholder="Enter keyword"
              onChange={(evt) => this.setState({ q: evt.target.value })}
              onPressEnter={() => onSubmit(this.state)}
            />
          </Col>
        ) : null}
        {statuses && statuses.length > 0 ? (
          <Col lg={6} md={8}>
            <Select
              onChange={(val) => {
                const objectFilter = keyFilter ? { [keyFilter]: val } : { status: val };
                this.setState(objectFilter, () => onSubmit(this.state));
              }}
              style={{ width: '100%' }}
              placeholder="Select status"
            >
              {statuses.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {type && type.length > 0 ? (
          <Col lg={6} md={8}>
            <Select
              onChange={(val) => {
                const objectFilter = keyFilter ? { [keyFilter]: val } : { type: val };
                this.setState(objectFilter, () => onSubmit(this.state));
              }}
              style={{ width: '100%' }}
              placeholder="Select type"
            >
              {type.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {sourceType && sourceType.length > 0 ? (
          <Col lg={6} md={8}>
            <Select
              onChange={(val) => {
                const objectFilter = keyFilter ? { [keyFilter]: val } : { sourceType: val };
                this.setState(objectFilter, () => onSubmit(this.state));
              }}
              style={{ width: '100%' }}
              placeholder="Select type"
              defaultValue=""
            >
              {sourceType.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {searchWithPerformer && (
          <Col lg={6} md={8}>
            <SelectPerformerDropdown
              placeholder="Search performer"
              style={{ width: '100%' }}
              onSelect={(val) => this.setState({ performerId: val || '', perId: val }, () => onSubmit(this.state))}
              defaultValue={performerId || ''}
            />
          </Col>
        )}
        {searchWithPerformerPayment && (
          <Col lg={6} md={8}>
            <SelectPerformerDropdownForPayment
              placeholder="Search performer"
              style={{ width: '100%' }}
              onSelect={(val) => this.setState({ performerId: val || '', perId: val }, () => onSubmit(this.state))}
              defaultValue={performerId || ''}
            />
          </Col>
        )}
        {searchWithSubPerformer && (
          <Col lg={6} md={8}>
            <SelectSubPerformerDropdown
              placeholder="Search agency"
              style={{ width: '100%' }}
              state={perId}
              onSelect={(val) => this.setState({ subPerformerId: val || '' }, () => onSubmit(this.state))}
            />
          </Col>
        )}
        {searchWithGallery && (
          <Col lg={6} md={8}>
            <SelectGalleryDropdown
              placeholder="Type to search gallery here"
              style={{ width: '100%' }}
              onSelect={(val) => this.setState({ galleryId: val || '' }, () => onSubmit(this.state))}
              defaultValue={galleryId || ''}
            />
          </Col>
        )}
        {searchPayoutStatus && (
        <Col lg={6} md={8}>
          <SelectStatusIsPaid
            placeholder="Select payout status"
            style={{ width: '100%' }}
            onSelect={(val) => this.setState({ isPaid: val || '' }, () => onSubmit(this.state))}
          />
        </Col>
        )}
        {searchLatestPayment ? (
          <Col lg={6} md={8}>
            <Select
              onSelect={(val) => this.setState({ latestPayment: val || '' }, () => onSubmit(this.state))}
              style={{ width: '100%' }}
              placeholder="Latest Payment Status"
            >
              <Select.Option key="" value="">
                All latest payment
              </Select.Option>
              <Select.Option key="true" value="true">
                Yes
              </Select.Option>
              <Select.Option key="false" value="false">
                No
              </Select.Option>
            </Select>
          </Col>
        ) : null}
        {dateRange && (
          <Col lg={6} md={8}>
            <RangePicker
              onChange={(dates: [any, any], dateStrings: [string, string]) => this.setState({ fromDate: dateStrings[0], toDate: dateStrings[1] }, () => onSubmit(this.state))}
            />
          </Col>
        )}
      </Row>
    );
  }
}
