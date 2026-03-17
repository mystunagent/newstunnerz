import Head from 'next/head';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Layout, message, Tabs } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import {
  IPerformer, IUIConfig
} from 'src/interfaces';
import PerformerBankingForm from '@components/performer/banking-form';
import { performerService } from '@services/index';
import PageHeading from '@components/common/page-heading';
import '../../user/index.less';
import Router from 'next/router';

interface IProps {
  user: IPerformer,
  ui: IUIConfig
}
const BankingSettings = ({ user, ui }: IProps) => {
  const { bankingInformation } = user;
  const [activeTab, setActiveTab] = useState<string>(bankingInformation?.type === 'sepa' ? 'sepa-banking' : 'wire-banking');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleUpdateBanking = async (data) => {
    const alertMess = `
    You will need to set up again the bank account and you will lose all previous bank information
    The changes will be reviewed and the payments on the new account will be done after 15-20 working days.
    `;

    if (!window.confirm(alertMess)) {
      return;
    }
    try {
      setSubmitting(true);

      const info = { ...data, performerId: user._id };
      await performerService.updateBanking(user._id, info);
      message.success('Banking account was updated successfully!');
    } catch (error) {
      const err = await error;
      message.error(err?.message || 'An error orccurred, please try again.');
    } finally {
      setSubmitting(false);
      window.location.reload();
    }
  };

  useEffect(() => {
    if (user?.infoSubPerformer?._id) {
      Router.push('/');
    }
  }, []);

  return (
    <Layout>
      <Head>
        <title>
          {ui && ui.siteName}
          {' '}
          | Banking
        </title>
      </Head>
      <div className="main-container">
        <PageHeading icon={<BankOutlined />} title="Banking" />
        <Tabs
          defaultActiveKey={activeTab}
          tabPosition="top"
          onChange={(tab) => setActiveTab(tab)}
        >
          <Tabs.TabPane tab="European and UK Bank Transfer" key="sepa-banking">
            <PerformerBankingForm
              onFinish={handleUpdateBanking.bind(this)}
              updating={submitting}
              bankingType="sepa"
              initialValues={user.bankingInformation}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="International Wire Transfer" key="wire-banking">
            <PerformerBankingForm
              onFinish={handleUpdateBanking.bind(this)}
              updating={submitting}
              bankingType="wire"
              initialValues={user.bankingInformation}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Bitsafe" key="bitsafe-banking">
            <PerformerBankingForm
              onFinish={handleUpdateBanking.bind(this)}
              updating={submitting}
              bankingType="bitsafe"
              initialValues={null}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Layout>
  );
};

BankingSettings.authenticate = true;

BankingSettings.onlyPerformer = true;

const mapStates = (state: any) => ({
  ui: state.ui,
  user: state.user.current
});

export default connect(mapStates)(BankingSettings);
