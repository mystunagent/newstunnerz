import Head from 'next/head';
import { connect } from 'react-redux';
import { Layout } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import {
  IUIConfig
} from 'src/interfaces';
import PageHeading from '@components/common/page-heading';
import BankingInfoSubPerformer from '@components/performer/banking-info-sub-performer';

interface IProps {
  user: any;
  ui: IUIConfig
}
const BankingSubPerformerSettings = ({ user, ui }: IProps) => (
  <Layout>
    <Head>
      <title>
        {ui && ui.siteName}
        {' '}
        | My Bank Details
      </title>
    </Head>
    <div className="main-container">
      <PageHeading icon={<BankOutlined />} title="My Bank Details" />
      <BankingInfoSubPerformer userId={user?.infoSubPerformer?._id?.toString()} />
    </div>
  </Layout>
);

BankingSubPerformerSettings.authenticate = true;

BankingSubPerformerSettings.onlyPerformer = true;

const mapStates = (state: any) => ({
  ui: state.ui,
  user: state.user.current
});

export default connect(mapStates)(BankingSubPerformerSettings);
