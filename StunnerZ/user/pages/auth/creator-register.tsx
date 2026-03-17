import {
  useRef, useState, useEffect
} from 'react';
import { isEmpty } from 'lodash';
import Router from 'next/router';
import Tabs from '@components/common/base/tabs';
import BasicInfoRegister from '@components/auth/model-register/basic-info';
import PricingSettingRegister from '@components/auth/model-register/pricing-form';
import BankingSettingRegister from '@components/auth/model-register/banking-form';
import NotifyBanner from '@components/common/notify-banner';
import { authService } from '@services/auth.service';
import { utilsService } from '@services/utils.service';
import {
  Form, Layout, Button, message, Checkbox
} from 'antd';

import Head from 'next/head';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

interface IProps {
  rel: string;
}

function ModelRegisterPage({ rel }: IProps) {
  const formData = useRef({} as any);
  const formInfo = useRef(null);
  const formBank = useRef(null);
  const formPricing = useRef(null);
  const currentTab = useRef('basic-info');
  const [countries, setCountries] = useState([]);
  const [bodyInfo, setBodyInfo] = useState({} as any);
  const [submitting, setSubmitting] = useState(false);
  const [isOpenBanking, setIsOpenBanking] = useState<boolean>(false);
  const [tosConfirm, setTosConfirm] = useState({
    ctc_confirm: false,
    tfc_confirm: false,
    tos_confirm: false,
    tosf_confirm: false
  });

  const loadData = async () => {
    const [countriesRes, bodyInfoRes] = await Promise.all([
      utilsService.countriesList(),
      utilsService.bodyInfo()
    ]);
    setCountries(countriesRes.data as any);
    setBodyInfo(bodyInfoRes.data);
  };

  const setFormData = (field, value) => {
    formData.current = {
      ...formData.current,
      [field]: value
    };
  };

  const checkBanking = async () => {
    if (!formBank.current) return false;
    try {
      await formBank.current.validateFields();
      return true;
    } catch (e) {
      const err = await e;
      if (err?.errorFields?.length > 0) {
        return false;
      }
      return true;
    }
  };

  const validateFormDataAndSubmit = async () => {
    const bankingStatus = await checkBanking();
    if (!bankingStatus) {
      message.error('Please check banking and fill all of fields');
      return false;
    }
    try {
      const {
        basicInfo = {},
        // bankingInfo = {},
        pricingInfo = {}
      } = formData.current;
      if (!basicInfo?.avatarId) {
        return message.error('Please upload your profile picture before proceeding!');
      }
      const bankingForm = formBank?.current?.getFieldsValue();
      if (isEmpty(bankingForm)) {
        return message.error('Please fill banking info to complete your account!');
      }
      if (!tosConfirm.ctc_confirm || !tosConfirm.tfc_confirm || !tosConfirm.tos_confirm || !tosConfirm.tosf_confirm) {
        return message.error('Please agree to the terms!');
      }
      setSubmitting(true);
      const bankingInfo = {
        ...bankingForm,
        type: bankingForm?.sepa_beneficiary_name ? 'sepa' : 'wire'
      };

      const resp = await authService.registerPerformerNewFlow({
        ...basicInfo,
        bankingInfo,
        pricingInfo,
        rel
      });
      if (resp?.data?.url) {
        return Router.push(resp.data.url);
      }

      setSubmitting(false);
      return message.error('An error occured, please try again later');
    } catch (e) {
      const err = await e;
      setSubmitting(false);
      return message.error(err.message || 'An error occured, please try again later');
    }
  };

  const onFinish = async (data) => {
    switch (currentTab.current) {
      case 'basic-info':
        await formInfo.current.validateFields();
        setFormData('basicInfo', data);
        break;
      case 'pricing-setting':
        await formPricing.current.validateFields();
        setFormData('pricingInfo', data);
        break;
      default: break;
    }
    // validate tab and submit
    validateFormDataAndSubmit();
  };

  const onSubmit = () => {
    switch (currentTab.current) {
      case 'basic-info':
        formInfo.current.submit();
        break;
      case 'pricing-setting':
        formPricing.current.submit();
        break;
      default: break;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Layout>
      <Head>
        <title>Creator Sign Up</title>
      </Head>
      <div className="main-container user-account">
        <NotifyBanner />
        <Tabs
          defaultActiveKey="basic-info"
          tabPosition="top"
          className="nav-tabs custom"
          onChange={(tab) => {
            currentTab.current = tab;
          }}
        >
          <Tabs.TabPane tab={<span>Account Settings</span>} key="basic-info">
            <BasicInfoRegister
              options={{
                uploadHeaders: {},
                avatarUploadUrl: authService.getAvatarUploadUrl(),
                coverUploadUrl: authService.getCoverUploadUrl(),
                videoUploadUrl: authService.getVideoUploadUrl()
              }}
              countries={countries}
              bodyInfo={bodyInfo}
              onFinish={onFinish}
              formRef={formInfo}
            />

            <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 0 }}>
              <Button
                className="primary"
                type="primary"
                htmlType="button"
                onClick={() => setIsOpenBanking(!isOpenBanking)}
              >
                Banking Setup
              </Button>
              {' '}
              <Button
                className="primary"
                type="primary"
                htmlType="submit"
                onClick={onSubmit}
                disabled={submitting}
              >
                Verify your ID
              </Button>
            </Form.Item>
            <br />
            {isOpenBanking && <BankingSettingRegister onFinish={onFinish} formRef={formBank} />}

            <div className="tos-confirm-container">
              <p>
                By ticking the boxes below you confirm that you have read and
                agree to the terms
              </p>
              <p>
                <Checkbox onChange={(v) => setTosConfirm({ ...tosConfirm, tos_confirm: v.target.checked })}>
                  <a href="/page/terms-of-service" target="_blank">
                    General Terms of Service
                  </a>
                </Checkbox>
              </p>
              <p>
                <Checkbox onChange={(v) => setTosConfirm({ ...tosConfirm, tfc_confirm: v.target.checked })}>
                  <a href="/page/terms-followers-creators" target="_blank">
                    Terms between Followers and Creator
                  </a>
                </Checkbox>
              </p>
              <p>
                <Checkbox onChange={(v) => setTosConfirm({ ...tosConfirm, ctc_confirm: v.target.checked })}>
                  <a href="/page/content-toc" target="_blank">
                    Content Terms and Compliance
                  </a>
                </Checkbox>
              </p>
              <p>
                <Checkbox onChange={(v) => setTosConfirm({ ...tosConfirm, tosf_confirm: v.target.checked })}>
                  <a href="/page/terms-of-services-for-followers" target="_blank">
                    Terms of Service for Followers
                  </a>
                </Checkbox>
              </p>
            </div>
            <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 0 }}>
              <Button
                className="primary"
                type="primary"
                htmlType="submit"
                onClick={onSubmit}
                disabled={submitting}
              >
                Save and continue
              </Button>
            </Form.Item>
          </Tabs.TabPane>
          <Tabs.TabPane tab={<span>Pricing Settings</span>} key="pricing-setting">
            <PricingSettingRegister transactionCost={0.04} formRef={formPricing} onFinish={onFinish} />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Layout>
  );
}

ModelRegisterPage.authenticate = false;

ModelRegisterPage.getInitialProps = ({ ctx }) => ({
  rel: ctx?.query?.rel
});

export default ModelRegisterPage;
