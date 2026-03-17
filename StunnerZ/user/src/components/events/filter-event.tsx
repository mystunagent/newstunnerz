import {
  Col, Input, Layout, Row, DatePicker
} from 'antd';
import { useState } from 'react';

type IProps = {
  handleFilter: Function;
};
const { RangePicker } = DatePicker;

export default function FilterEventForm({ handleFilter }: IProps) {
  const [q, setQ] = useState('');

  return (
    <Layout>
      <Row>
        <Col xs={24} md={12} lg={12}>
          <Input placeholder="Enter title or description ..." onChange={(e) => setQ(e.target.value)} onPressEnter={() => handleFilter({ q })} />
        </Col>
        <Col xs={24} md={12} lg={12}>
          <RangePicker
            style={{ width: '100%' }}
            onChange={(dates: [any, any], dateStrings: [string, string]) => {
              handleFilter({ startAt: dateStrings[0], endAt: dateStrings[1] });
            }}
            allowClear
          />
        </Col>
      </Row>
    </Layout>
  );
}
