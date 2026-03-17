import {
  Col, DatePicker, Input, Row
} from 'antd';
import { useState } from 'react';

type IProps = {
  handleFilter: Function;
};
const { RangePicker } = DatePicker;

export default function FilterEventForm({ handleFilter }: IProps) {
  const [q, setQ] = useState('');

  return (
    <>
      <Row>
        <Col xs={24} md={24} lg={12}>
          <Input placeholder="Enter name event ..." onChange={(e) => setQ(e.target.value)} onPressEnter={() => handleFilter({ q })} />
        </Col>
        <Col xs={24} md={24} lg={12}>
          <RangePicker
            style={{ width: '100%' }}
            onChange={(dates: [any, any], dateStrings: [string, string]) => {
              handleFilter({ startAt: dateStrings[0], endAt: dateStrings[1] });
            }}
            allowClear
          />
        </Col>
      </Row>
    </>
  );
}
