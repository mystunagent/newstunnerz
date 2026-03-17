import { authService } from "@services/auth.service";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Popover,
  Row,
  Select,
} from "antd";
import { useState } from "react";

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};
const validateMessages = {
  required: "This field is required!",
  types: {
    email: "Not a valid email!",
    number: "Not a valid number!",
  },
  number: {
    // eslint-disable-next-line no-template-curly-in-string
    range: "Must be between ${min} and ${max}",
  },
};
interface IProps {
  onFinish: Function;
  // eslint-disable-next-line react/require-default-props
  account?: any;
  // eslint-disable-next-line react/require-default-props
  updating?: boolean;
  // eslint-disable-next-line react/require-default-props
  options?: any;
}
export function SwitchPerformerSubAccountForm({
  onFinish,
  updating = false,
  account = null,
}: IProps) {
  const [loading, setLoading] = useState(false);
  const onVerifyEmail = async () => {
    try {
      setLoading(true);
      const resp = await authService.verifyEmail({
        sourceType: "user",
        source: account,
      });
      resp.data && resp.data.message && message.success(resp.data.message);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      const error = await e;
      message.error(
        error?.message || "An error occurred, please try again later"
      );
    }
  };

  return (
    <Form
      {...layout}
      name="nest-messages"
      onFinish={onFinish.bind(this)}
      validateMessages={validateMessages}
      initialValues={
        {
          status: "active",
        }
      }
    >
      <Row>
        <Col lg={12} md={12} xs={24}>
          <Form.Item
            name="firstName"
            label="First Name"
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              { required: true, message: "Please input your first name!" },
              {
                pattern: new RegExp(/^(?=.*\S).+$/g),
                message: "First name can not contain only whitespace",
              },
              {
                min: 3,
                message: "First name must containt at least 3 characters",
              },
            ]}
            hasFeedback
          >
            <Input />
          </Form.Item>
        </Col>
        <Col lg={12} md={12} xs={24}>
          <Form.Item
            name="lastName"
            label="Last name"
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              { required: true, message: "Please input your last name!" },
              {
                pattern: new RegExp(/^(?=.*\S).+$/g),
                message: "Last name can not contain only whitespace",
              },
              {
                min: 3,
                message: "Last name must containt at least 3 characters",
              },
            ]}
            hasFeedback
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={12} md={12}>
          <Form.Item
            name="username"
            label="Agency Username"
            rules={[
              { required: true },
              {
                pattern: /^[a-zA-Z0-9]+$/g,
                message:
                  "Agency username must contain only alphanumeric characters",
              },
              { min: 3 },
            ]}
          >
            <Input placeholder="Unique, lowercase alphanumeric characters" />
          </Form.Item>
        </Col>
        <Col lg={12} md={12} xs={24}>
          <Form.Item
            name="email"
            label={
              <span style={{ fontSize: 10 }}>
                Email Address
                {"  "}
                {account?.verifiedEmail ? (
                  <Popover
                    title="Your email address is verified"
                    content={null}
                  >
                    <a className="success-color">Verified!</a>
                  </Popover>
                ) : (
                  <Popover
                    title="Your email address is not verified"
                    content={
                      <Button
                        type="primary"
                        onClick={onVerifyEmail}
                        disabled={loading}
                        loading={loading}
                      >
                        Click here to send the verification link
                      </Button>
                    }
                  >
                    <a className="error-color">Not verified!</a>
                  </Popover>
                )}
              </span>
            }
            rules={[
              { type: "email" },
              { required: true, message: "Please input your email address!" },
            ]}
            hasFeedback
            validateTrigger={["onChange", "onBlur"]}
          >
            <Input disabled={account?.googleConnected} />
          </Form.Item>
        </Col>
        <Col md={12} xs={24}>
          <Form.Item
            label="Confirm Email Address"
            name="confirmEmail"
            dependencies={["email"]}
            hasFeedback
            rules={[
              { type: "email" },
              {
                required: true,
                message: "Please confirm your email address!",
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (!value || getFieldValue("email") === value) {
                    return Promise.resolve();
                  }
                  // eslint-disable-next-line prefer-promise-reject-errors
                  return Promise.reject("Emails do not match together!");
                },
              }),
            ]}
          >
            <Input placeholder="Confirm email address" />
          </Form.Item>
        </Col>
        <Col md={12} xs={24} key="password">
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please input your password!" },
              {
                min: 8,
                message: "Password must have minimum 8 characters",
              },
            ]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
        </Col>
        ,
        <Col md={12} xs={24} key="confirmPassword">
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            validateTrigger={["onChange", "onBlur"]}
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: "Please confirm your password!",
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  // eslint-disable-next-line prefer-promise-reject-errors
                  return Promise.reject("Passwords do not match together!");
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm password" />
          </Form.Item>
        </Col>
        {account && (
          <Col xs={12} md={12}>
            <Form.Item name="balance" label="Agency Earnings">
              <Input disabled />
            </Form.Item>
          </Col>
        )}
        <Col xs={12} md={12}>
          <Form.Item
            rules={[
              {
                required: true,
                message: "Please set the agency commission",
              },
            ]}
            name="commissionExternalAgency"
            label="Commission Of External Agency"
            extra="If the agency commission is 20%, you will receive 80% of your earnings."
          >
            <InputNumber type="number" min={0} max={100} />
          </Form.Item>
        </Col>
        <Col xs={12} md={12}>
          <Form.Item name="status" label="Status">
            <Select>
              <Select.Option key="active" value="active">
                Active
              </Select.Option>
              <Select.Option key="inactive" value="inactive">
                Inactive
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        {/* <Col xs={12} md={12}>
          <Form.Item label="Avatar">
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <AvatarUpload
                image={account?.avatarPath}
                uploadUrl={options.avatarUrl}
                headers={options.uploadHeader}
                onUploaded={options.uploadAvatar}
              />
            </div>
          </Form.Item>
        </Col> */}
      </Row>
      <Form.Item className="text-center">
        <Button type="primary" htmlType="submit" loading={updating}>
          Switch Account
        </Button>
      </Form.Item>
    </Form>
  );
}
