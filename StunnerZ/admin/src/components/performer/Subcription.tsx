import { PureComponent } from 'react';
import {
  Form, Button, message, InputNumber, Row, Col, Switch
} from 'antd';
import { IPerformer } from 'src/interfaces';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!'
};

interface IProps {
  onFinish: Function;
  performer: IPerformer;
  submiting?: boolean;
  siteCommission?: any;
}

export class SubscriptionForm extends PureComponent<IProps> {
  state = {
    isTrialSubscription: false
  }

  maxPrice = 499;

  componentDidMount() {
    const { performer } = this.props;
    this.setState({ isTrialSubscription: !!performer.isTrialSubscription });
  }

  calculateMaxPrice() {
    const { siteCommission } = this.props;
    if (!siteCommission?.transactionCost) return 499;
    const percent = siteCommission?.transactionCost || 0.04;
    return Math.floor(this.maxPrice / (1 + percent));
  }

  render() {
    const { performer, onFinish, submiting } = this.props;
    const { isTrialSubscription } = this.state;
    return (
      <Form
        {...layout}
        name="form-performer"
        onFinish={(values) => onFinish({ ...values, isTrialSubscription })}
        onFinishFailed={() => message.error('Please complete the required fields in tab general info')}
        validateMessages={validateMessages}
        initialValues={
          performer || ({
            trialPrice: 1.99,
            durationTrialSubscriptionDays: 3,
            durationOneTimeSubscriptionDays: 180,
            oneTimePrice: 60.99,
            monthlyPrice: 9.99,
            sixMonthPrice: 50.99,
            publicChatPrice: 1
          })
        }
      >
        <Row>
          <Col xs={24} md={12}>
            <Form.Item>
              <Switch
                unCheckedChildren="Non-trial Subscription"
                checkedChildren="Trial Subcription"
                checked={isTrialSubscription}
                onChange={() => this.setState({ isTrialSubscription: !isTrialSubscription })}
              />
            </Form.Item>
            {isTrialSubscription && [
              (
                <Form.Item
                  name="durationTrialSubscriptionDays"
                  label="Duration (days)"
                  help="Number of Days for Trial Price (min 3 days)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={3} />
                </Form.Item>
              ),
              (
                <Form.Item
                  key="trial"
                  name="trialPrice"
                  label="Trial Price (min 1.99 USD)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1.99} />
                </Form.Item>
              )
            ]}
            <Form.Item
              name="durationOneTimeSubscriptionDays"
              label="Duration (days)"
              help="Number of Days for One Time Price (minimum 180 days, maximum 365 days)"
              rules={[{ required: true }]}
            >
              <InputNumber min={180} max={365} />
            </Form.Item>
            <Form.Item
              key="oneTime"
              name="oneTimePrice"
              label={`One Time Subscription Price $ (min 2 USD, max ${this.calculateMaxPrice() || 499} USD)`}
              rules={[{ required: true }]}
            >
              <InputNumber min={2} max={this.calculateMaxPrice() || 499} />
            </Form.Item>
            <Form.Item
              key="six_month"
              name="sixMonthPrice"
              label="Six Month Subscription Price $"
              rules={[{ required: true }]}
            >
              <InputNumber min={2} />
            </Form.Item>
            <Form.Item
              key="monthly"
              name="monthlyPrice"
              label="Monthly Subscription Price ($)"
              rules={[{ required: true }]}
            >
              <InputNumber min={2} />
            </Form.Item>
            <Form.Item
              key="publicChatPrice"
              name="publicChatPrice"
              label="Default Streaming Price (token)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" disabled={submiting} loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
