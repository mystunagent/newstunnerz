import {
  Form, Input, Button, Row, Col
} from 'antd';

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
  updating?: boolean;
  bankingType?: string;
  initialValues: any;
}

const PerformerBankingForm = ({
  onFinish, updating, bankingType, initialValues
}: IProps) => {
  const renderSepaForm = () => (
    <>
      <Col span={24}>
        <div className="notify-banner bordered">
          <p>
            For setting up the a European and UK bank transfer from Stunnerz you need to provide the account name and the IBAN (International Bank Account Number).
          </p>
          <p>Tips to find the IBAN:</p>
          <ol>
            <li>
              Directly on your bank cards or it
            </li>
            <li>
              Check the top of bank statements or your bank&apos;s online page on in your banking app
            </li>
            <li>
              Get in touch with your bank to request it.
            </li>
          </ol>
          <p>
            If you have a UK Bank account, you can generate the IBAN in this site IBAN Calculator:
            {' '}
            <a href="https://www.iban.com/calculate-iban" target="_blank" rel="noreferrer">IBAN Calculator: Calculate IBAN from Bank Code and Account Number</a>
          </p>
        </div>
      </Col>
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
      <Col span={24}>
        <div className="notify-banner bordered">
          <p>
            For receiving your payments from Stunnerz in your bank located outside EU and UK you need to use SWIFT transaction, commonly known as International Wire transactions.
          </p>

          <p>
            To locate your SWIFT/BIC code, check any paper or digital banking statements, or look at your account details on your online banking profile. You can also search for your
            BIC code using a digital SWIFT/BIC search tool by providing your country and bank location data here
            {' '}
            <a href="https://www.iban.com/search-bic" target="_blank" rel="noreferrer">BIC Code Search | Find BIC by Bank Name (iban.com)</a>
          </p>
        </div>
      </Col>
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
            placeholder="beneficiary name"
          />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item
          name="beneficiary_street"
          label="Beneficiary street"
          rules={[{ required: true, message: 'Beneficiary street is required' }]}
        >
          <Input placeholder="beneficiary street" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item
          name="beneficiary_city"
          label="Beneficiary city"
          rules={[{ required: true, message: 'Beneficiary city is required' }]}
        >
          <Input placeholder="beneficiary city" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item
          name="beneficiary_postal_code"
          label="Beneficiary postal code"
          rules={[{ required: true, message: 'Beneficiary postal code is required' }]}
        >
          <Input placeholder="beneficiary postal code" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item
          name="beneficiary_country_code"
          label="Beneficiary country code"
          rules={[{ required: true, message: 'Beneficiary country code is required' }]}
        >
          <Input placeholder="beneficiary country code" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item name="beneficiary_account" label="Beneficiary account" rules={[{ required: true, message: 'Beneficiary account is required' }]}>
          <Input placeholder="beneficiary account" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item name="bic_code" label="bic code" rules={[{ required: true, message: 'Bic code is required' }]}>
          <Input placeholder="bic code" />
        </Form.Item>
      </Col>
      <Col xl={12} md={12} xs={12}>
        <Form.Item name="intermediary_bank_bic_code" label="Intermediary bank bic code" rules={[{ required: true, message: 'Intermediary bank bic code is required' }]}>
          <Input placeholder="intermediary bank bic code" />
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
        <img src="/static/bitsafe-logo.png" alt="bitsafe-logo" />
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
      onFinish={(data) => {
        onFinish({ ...data, type: bankingType });
      }}
      validateMessages={validateMessages}
      initialValues={initialValues}
      labelAlign="left"
      className="account-form"
    >
      <Row>
        {bankingType === 'sepa' && renderSepaForm()}
        {bankingType === 'wire' && renderIntWireForm()}
        {bankingType === 'bitsafe' && renderBitsafeForm()}
      </Row>
      {bankingType !== 'bitsafe' && (
        <Form.Item className="text-center">
          <Button
            className="primary"
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
  updating: false,
  bankingType: 'wire'
};

export default PerformerBankingForm;
