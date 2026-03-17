import React, { useState } from 'react';
import {
  Input, Row, Col, Select, DatePicker
} from 'antd';
import moment from 'moment';
import { SelectPerformerDropdown } from './common/select-performer-dropdown';

const { RangePicker } = DatePicker;

interface IProps {
  onSubmit: Function;
  bankingType: string;
}

const BankingSearchFilter = ({
  onSubmit, bankingType
}: IProps) => {
  const [q, setQ] = useState<string>('');
  const [selectDates, setSelectDates] = useState<any>(null);

  const disabledDate = (current: any) => {
    if (!selectDates) {
      return false;
    }
    const tooLate = selectDates[0] && current.diff(selectDates[0], 'days') < 1;
    const tooEarly = selectDates[1] && selectDates[1].diff(current, 'days') < 1;
    return !!tooEarly || !!tooLate;
  };

  const onOpenChange = (open: boolean) => {
    if (open) {
      setSelectDates([null, null]);
    } else {
      setSelectDates(null);
    }
  };

  return (
    <Row gutter={24}>
      <Col lg={4} xs={24}>
        <Input
          placeholder="Enter keyword"
          onChange={(evt) => setQ(evt.target.value)}
          onPressEnter={() => onSubmit({ q })}
        />
      </Col>
      <Col lg={4} xs={12}>
        <Select
          defaultValue={bankingType}
          style={{ width: '100%' }}
          onChange={(val) => onSubmit({ bankingType: val })}
        >
          <Select.Option value="wire">Int. Wire</Select.Option>
          <Select.Option value="sepa">Sepa</Select.Option>
        </Select>
      </Col>
      <Col lg={4} md={12}>
        <SelectPerformerDropdown
          placeholder="Search performer"
          style={{ width: '100%' }}
          onSelect={(val) => onSubmit({ performerId: val || '' })}
          defaultValue=""
        />
      </Col>
      <Col lg={4} md={12}>
        <DatePicker
          style={{ width: '100%' }}
          placeholder="Payment date"
          disabledDate={disabledDate}
          onChange={(date) => onSubmit({ paymentAt: date || '' })}
        />
      </Col>
      <Col lg={4} md={12}>
        <RangePicker
          disabledDate={disabledDate}
          onCalendarChange={(val) => setSelectDates(val)}
          onChange={(dates: [any, any], dateStrings: [string, string]) => onSubmit({ fromDate: dateStrings[0] || '', toDate: dateStrings[1] || '' })}
          onOpenChange={onOpenChange}
        />
      </Col>

    </Row>
  );
};

export default BankingSearchFilter;
