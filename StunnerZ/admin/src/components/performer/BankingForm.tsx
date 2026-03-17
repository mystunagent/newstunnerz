import { useState } from 'react';
import {
  Form, Input, Button, Row, Col, Select
} from 'antd';

const { Option } = Select;
const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!',
  types: {
    email: 'Not a validate email!',
    number: 'Not a validate number!'
  },
  number: {
    // eslint-disable-next-line no-template-curly-in-string
    range: 'Must be between ${min} and ${max}'
  }
};

interface IProps {
  onFinish: Function;
  updating?: boolean;
  initialValues: any;
}

const PerformerBankingForm = ({
  onFinish, updating, initialValues
}: IProps) => {
  const [type, setType] = useState(initialValues?.type);

  const renderSepaForm = () => (
    <>
      <Col xl={12} md={12} xs={12}>
        <Form.Item
          label="Beneficiary name"
          name="sepa_beneficiary_name"
          rules={[{
            required: true,
            message: 'Beneficiary name is required'
          }]}
        >
          <Input
            placeholder="Beneficiary name"
          />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item name="sepa_beneficiary_iban" label="Beneficiary IBAN" rules={[{ required: true, message: 'IBAN is required' }]}>
          <Input placeholder="IBAN" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item name="sepa_currency" label="Currency" rules={[{ required: true, message: 'Currency is required' }]}>
          <Input placeholder="Currency" />
        </Form.Item>
      </Col>
    </>
  );

  const renderIntWireForm = () => (
    <>
      <Col xl={12} md={12} xs={12}>
        <Form.Item
          label="Beneficiary name"
          name="beneficiary_name"
          rules={[{
            required: true,
            message: 'Beneficiary name is required'
          }]}
        >
          <Input
            placeholder="beneficiary_name"
          />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item
          name="beneficiary_street"
          label="Beneficiary street"
          rules={[{ required: true, message: 'Beneficiary street is required' }]}
        >
          <Input placeholder="beneficiary_street" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item
          name="beneficiary_city"
          label="Beneficiary city"
          rules={[{ required: true, message: 'Beneficiary city is required' }]}
        >
          <Input placeholder="beneficiary_city" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item
          name="beneficiary_postal_code"
          label="Beneficiary postal code"
          rules={[{ required: true, message: 'Beneficiary postal code is required' }]}
        >
          <Input placeholder="beneficiary_postal_code" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item
          name="beneficiary_country_code"
          label="Beneficiary country code"
          rules={[{ required: true, message: 'Beneficiary country code is required' }]}
        >
          <Input placeholder="beneficiary_country_code" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item name="beneficiary_account" label="Beneficiary account" rules={[{ required: true, message: 'Beneficiary account is required' }]}>
          <Input placeholder="beneficiary_account" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item name="bic_code" label="bic code" rules={[{ required: true, message: 'Bic code is required' }]}>
          <Input placeholder="bic_code" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item name="intermediary_bank_bic_code" label="Intermediary bank bic code" rules={[{ required: true, message: 'Intermediary bank bic code is required' }]}>
          <Input placeholder="intermediary_bank_bic_code" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item name="currency" label="currency" rules={[{ required: true, message: 'Currency is required' }]}>
          <Input placeholder="currency" />
        </Form.Item>
      </Col>
    </>
  );

  const renderBitsafeForm = () => (
    <>
      <Col span={24}>
        Bitsafe offers a basic payment account with IBAN issued from the Netherland. Your IBAN is trusted worldwide and it is valid to send and receive payments from any bank
        To create the account in Bitsafe you need a valid ID document and follow the verification process required.
        In no event shall Stunnerz be liable for any loss of profits or any indirect loss, including without limitation, for partial or total business interruption or efficiency reduction.
      </Col>
      <Col span={24} style={{ textAlign: 'center', margin: 'auto' }}>
        <img src="/bitsafe-logo.png" alt="bitsafe-logo" />
      </Col>
      <Col span={24} style={{ textAlign: 'center' }}>
        <a href="https://bitsafe.com" target="_blank" rel="noreferrer">
          Bitsafe.com
        </a>
      </Col>
    </>
  );

  return (
    <Form
      {...layout}
      name="nest-messages"
      onFinish={(data) => onFinish({ ...data, type })}
      validateMessages={validateMessages}
      initialValues={initialValues}
      labelAlign="left"
      className="account-form"
    >
      <Form.Item label="Select your bank transfer system">
        <Select
          placeholder="Select banking type"
          onChange={(val) => setType(val)}
          value={type}
        >
          <Option value="wire" key="wire">Int. Wire</Option>
          <Option value="sepa" key="sepa">SEPA</Option>
          <Option value="bitsafe" key="bitsafe">Bitsafe</Option>
        </Select>
      </Form.Item>
      <Row>
        {type === 'sepa' && renderSepaForm()}
        {type === 'wire' && renderIntWireForm()}
        {type === 'bitsafe' && renderBitsafeForm()}
      </Row>
      {type !== 'bitsafe' && (
        <Form.Item className="text-center">
          <Button
            type="primary"
            htmlType="submit"
            loading={updating}
            disabled={updating}
          >
            Save Changes
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

PerformerBankingForm.defaultProps = {
  updating: false
};

export default PerformerBankingForm;
