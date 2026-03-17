import {
  Col, DatePicker, Row, Select
} from 'antd';
import { useEffect, useState } from 'react';

type IProps = {
  onFilter: Function;
};

const { RangePicker } = DatePicker;

export default function FormFilterAvailableTime({ onFilter }: IProps) {
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    onFilter({ startAt, endAt, status });
  }, [startAt, endAt, status]);

  return (
    <Row>
      <Col xs={24} md={12} lg={12}>
        <RangePicker
          style={{ width: '100%' }}
          onChange={(dates: [any, any], dateStrings: [string, string]) => {
            setStartAt(dateStrings[0]);
            setEndAt(dateStrings[1]);
          }}
          allowClear
        />
      </Col>
      <Col xs={24} md={12} lg={12}>
        <Select
          style={{ width: '100%' }}
          defaultValue=""
          onSelect={(e) => setStatus(e.toString())}
          placeholder="Select status"
        >
          <Select.Option value="">All Status</Select.Option>
          <Select.Option value="active">Active</Select.Option>
          <Select.Option value="inactive">Inactive</Select.Option>
          <Select.Option value="expired">Expired</Select.Option>
        </Select>
      </Col>
    </Row>
  );
}
