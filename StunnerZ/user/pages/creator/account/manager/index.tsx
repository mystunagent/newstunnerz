'use client';

import NotifyBanner from '@components/common/notify-banner';
import AccountManagerForm from '@components/performer/account-manager-form';
import { Layout, PageHeader } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { useEffect } from 'react';
import { connect } from 'react-redux';

type IProps = {
  currentUser: any;
  settings: any;
  ui: any;
};

function AccountManagerPage({ settings, currentUser, ui }: IProps) {
  useEffect(() => {
    if (currentUser?.infoSubPerformer?._id) {
      Router.push('/');
    }
  }, []);

  return (
    <Layout>
      <Head>
        <title>
          {ui && ui.siteName}
          {' '}
          | Account Manager
        </title>
      </Head>
      <div className="main-container user-account">
        {!currentUser.completedAccount && <NotifyBanner />}
        <PageHeader onBack={() => Router.back()} title="Account Manager" />
        <AccountManagerForm settings={settings} performer={currentUser} />
      </div>
    </Layout>
  );
}

const mapStates = (state: any) => ({
  currentUser: state.user.current,
  ui: state.ui,
  settings: state.settings
});

export default connect(mapStates)(AccountManagerPage);
