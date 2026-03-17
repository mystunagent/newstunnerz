import { useState } from 'react';
import {
  Form, InputNumber, Row, Col, Switch, Divider
} from 'antd';

interface IProps {
  transactionCost?: number;
  formRef: any;
  onFinish: Function;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const MAX_PRICE = 499;

export default function PricingSettingRegister({
  transactionCost,
  formRef,
  onFinish
}: IProps) {
  const [isTrialSubscription, setTrialSubscription] = useState(false);

  const calculateMaxPrice = () => {
    if (!transactionCost) return 499;
    const percent = transactionCost || 0.04;
    return Math.floor(MAX_PRICE / (1 + percent));
  };

  return (
    <Form
      ref={formRef}
      {...layout}
      name="nest-messages"
      onFinish={(val) => onFinish(val)}
      initialValues={{
        isTrialSubscription: true,
        durationTrialSubscriptionDays: 3,
        trialPrice: 1.99,
        monthlyPrice: 10.99,
        // isSixMonthSubscription: true,
        sixMonthPrice: 50.99,
        // isOneTimeSubscription: true,
        durationOneTimeSubscriptionDays: 180,
        oneTimePrice: 60.99
      } as any} // todo should add interface
      scrollToFirstError
      className="account-form"
    >
      <Row>
        <Col xl={12} md={12} xs={24}>
          <Form.Item name="isTrialSubscription" valuePropName="checked">
            <Switch unCheckedChildren="Non-trial Subscription" checkedChildren="Trial Subcription" onChange={() => setTrialSubscription(!isTrialSubscription)} />
          </Form.Item>
          {isTrialSubscription && [
            (
              <Form.Item
                name="durationTrialSubscriptionDays"
                label="Number of Days for Trial Price (min 3 days)"
              >
                <InputNumber min={3} />
              </Form.Item>
            ),
            (
              <Form.Item
                name="trialPrice"
                label="Trial Price (min 1.99 USD)"
              >
                <InputNumber min={1.99} />
              </Form.Item>
            )
          ]}

          <Form.Item
            name="monthlyPrice"
            label="Monthly Subscription price ($)"
          >
            <InputNumber min={2} />
          </Form.Item>
          <Form.Item
            name="sixMonthPrice"
            label="Six Months Subscription price ($)"
          >
            <InputNumber min={2} />
          </Form.Item>
          <Divider />
          <Form.Item
            name="durationOneTimeSubscriptionDays"
            label="Number of Days for One Time Price (minimum 180 days, maximum 365 days)"
          >
            <InputNumber min={180} max={365} />
          </Form.Item>
          <Form.Item
            name="oneTimePrice"
            label={`One-time Price (min 2 USD, max ${calculateMaxPrice() || 499} USD)`}
          >
            <InputNumber min={2} max={calculateMaxPrice() || 499} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
