import { performerService } from '@services/performer.service';
import {
  Button,
  Col, InputNumber, Layout, message, Row
} from 'antd';
import { useState } from 'react';

type IProps = {
  user: any;
}

export default function FormSetUpPriceBookingStream({ user }: IProps) {
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(0);
  const handleSubmit = async () => {
    try {
      setLoading(true);
      await performerService.updatePriceBookStream({ price });
      message.success('Updated price book stream successfully');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  };

  return (
    <Layout>
      <div className="main-container">
        <h3 className="text-center">Setting Price Book Stream</h3>
      </div>
      <Row className="text-center">
        <Col xs={24} md={24} lg={24}>
          <InputNumber onChange={(e) => setPrice(e)} min={0} defaultValue={user?.bookingStreamPrice || 0} />
        </Col>
        <Col xs={24} md={24} lg={24}>
          <Button type="primary" loading={loading} disabled={loading} onClick={handleSubmit}>
            Submit
          </Button>
        </Col>
      </Row>
    </Layout>
  );
}
