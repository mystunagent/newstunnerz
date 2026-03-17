import { PureComponent } from 'react';
import {
  Form, InputNumber, Button, Row, Col, Switch, Divider
} from 'antd';
import { IPerformer } from 'src/interfaces';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!',
  types: {
    email: 'Not a validate email!',
    number: 'Not a validate number!'
  }
};

interface IProps {
  onFinish: Function;
  user: IPerformer;
  updating?: boolean;
  transactionCost?: number;
}

export class PerformerSubscriptionForm extends PureComponent<IProps> {
  state = {
    isTrialSubscription: false
  }

  maxPrice = 499;

  componentDidMount() {
    const { user } = this.props;
    this.setState({ isTrialSubscription: user.isTrialSubscription });
  }

  calculateMaxPrice() {
    const { transactionCost } = this.props;
    if (!transactionCost) return 499;
    const percent = transactionCost || 0.04;
    return Math.floor(this.maxPrice / (1 + percent));
  }

  render() {
    const { onFinish, user, updating } = this.props;
    const { isTrialSubscription } = this.state;
    return (
      <Form
        {...layout}
        name="nest-messages"
        onFinish={(values) => onFinish({ ...values, isTrialSubscription })}
        validateMessages={validateMessages}
        initialValues={user}
        labelAlign="left"
        className="account-form"
        scrollToFirstError
      >
        <Row>
          <Col xl={12} md={12} xs={24}>
            <Form.Item>
              <Switch unCheckedChildren="Non-trial Subscription" checkedChildren="Trial Subcription" checked={isTrialSubscription} onChange={() => this.setState({ isTrialSubscription: !isTrialSubscription })} />
            </Form.Item>
            {isTrialSubscription && [
              (
                <Form.Item
                  name="durationTrialSubscriptionDays"
                  label="Number of Days for Trial Price (min 3 days)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={3} />
                </Form.Item>
              ),
              (
                <Form.Item
                  name="trialPrice"
                  label="Trial Price (min 1.99 USD)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1.99} />
                </Form.Item>
              )
            ]}

            <Form.Item
              name="monthlyPrice"
              label="Monthly Subscription price ($)"
              rules={[{ required: true }]}
            >
              <InputNumber min={2} />
            </Form.Item>
            <Form.Item
              name="sixMonthPrice"
              label="Six Months Subscription price ($)"
              rules={[{ required: true }]}
            >
              <InputNumber min={2} />
            </Form.Item>
            <Divider />
            <Form.Item
              name="durationOneTimeSubscriptionDays"
              label="Number of Days for One Time Price (minimum 180 days, maximum 365 days)"
              rules={[{ required: true }]}
            >
              <InputNumber min={180} max={365} />
            </Form.Item>
            <Form.Item
              name="oneTimePrice"
              label={`One-time Price (min 2 USD, max ${this.calculateMaxPrice() || 499} USD)`}
              rules={[{ required: true }]}
            >
              <InputNumber min={2} max={this.calculateMaxPrice() || 499} />
            </Form.Item>
            <Form.Item
              name="pricePerMinuteBookStream"
              label="Price for per minute private stream"
            >
              <InputNumber min={0} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button className="primary" type="primary" htmlType="submit" disabled={updating} loading={updating}>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
