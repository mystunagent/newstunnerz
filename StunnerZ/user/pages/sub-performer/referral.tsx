import PageHeading from '@components/common/page-heading';
import {
  Divider,
  Layout, message, Popover, Tabs
} from 'antd';
import Head from 'next/head';
import { useSelector } from 'react-redux';
import { GiftOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { earningService, referralService } from '@services/index';
import ReferralLink from '@components/referral/referral-link';
import TableListReferralUser from '@components/referral/referral-user-table';
import { IReferralStats } from '@interfaces/referral';
import ReferralStat from '@components/referral/referral-stat';
import TableListReferralEarning from '@components/referral/referral-earning-table';

function ModelReferralPage() {
  const ui = useSelector((state: any) => state.ui);
  const user = useSelector((state: any) => state.user.current);
  const settings = useSelector((state: any) => state.settings);
  // Referral link
  const [referralLoading, setReferralLoading] = useState(false);
  const [linkReferral, setLinkReferral] = useState('');
  // Referral stat
  const [stats, setStats] = useState<IReferralStats>();
  // Referral earning
  const [earningLoading, setEarningLoading] = useState(false);
  const [listEarnings, setListEarnings] = useState([]);
  const [filterEarning] = useState({} as any);
  const [paginationEarning, setPaginationEarning] = useState({} as any);
  const [earningSortBy, setEarningSortBy] = useState('createdAt');
  const [earningSort, setEarningSort] = useState('desc');
  // Referral user
  const [usersLoading, setUsersLoading] = useState(false);
  const [listUsers, setListUsers] = useState([]);
  const [filterUser] = useState({} as any);
  const [paginationUser, setPaginationUser] = useState({} as any);
  const [usersSortBy, setUsersSortBy] = useState('createdAt');
  const [usersSort, setUsersSort] = useState('desc');

  const [limit] = useState(10);

  const getReferralCode = async () => {
    try {
      setReferralLoading(true);
      const resp = await referralService.getReferralCode();
      setLinkReferral(`${window.location.origin}?rel=${resp.data}`);
    } catch (e) {
      const err = await e;
      message.error(err.message || 'An error occurred!');
    } finally {
      setReferralLoading(false);
    }
  };

  const getUserStat = async () => {
    try {
      const resp = await earningService.referralStatsSubPerformer({ referralId: user?.infoSubPerformer?._id });
      setStats(resp.data);
    } catch (e) {
      const err = await e;
      message.error(err.message || 'An error occurred!');
    }
  };

  const referralMoneyEarningSearch = async (page = 1) => {
    try {
      setEarningLoading(true);
      const resp = await earningService.subPerformerSearch({
        referralId: user?.infoSubPerformer?._id,
        ...filterEarning,
        limit,
        offset: (page - 1) * limit,
        sort: earningSort,
        sortBy: earningSortBy
      });
      setListEarnings(resp.data.data);
      setPaginationEarning({ ...paginationEarning, total: resp.data.total, pageSize: limit });
    } catch (e) {
      const err = await e;
      message.error(err);
    } finally {
      setEarningLoading(false);
    }
  };

  const referralUserSearch = async (page = 1) => {
    try {
      setUsersLoading(true);
      const resp = await referralService.search({
        ...filterUser,
        limit,
        offset: (page - 1) * limit,
        sort: usersSort,
        sortBy: usersSortBy
      });
      setListUsers(resp.data.data);
      setPaginationUser({ ...paginationUser, total: resp.data.total, pageSize: limit });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'An error occurred!');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    getReferralCode();
    getUserStat();
    referralUserSearch();
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(linkReferral);
    message.success('Copied!');
  };

  const handleTableEarningChange = (pagination, filter, sorter) => {
    const pager = { ...paginationEarning };
    pager.current = pagination.current;
    setPaginationEarning(pager);
    setEarningSortBy(sorter.field || 'createdAt');
    // eslint-disable-next-line no-nested-ternary
    setEarningSort(sorter.order ? sorter.order === 'descend' ? 'desc' : 'asc' : 'desc');
    referralMoneyEarningSearch(pager.current);
  };

  const handleTableUserChange = (pagination, filter, sorter) => {
    const pager = { ...paginationUser };
    pager.current = pagination.current;
    setPaginationUser(pager);
    setUsersSortBy(sorter.field || 'createdAt');
    // eslint-disable-next-line no-nested-ternary
    setUsersSort(sorter.order ? sorter.order === 'descend' ? 'desc' : 'asc' : 'desc');
    referralUserSearch(pager.current);
  };

  const handlePageChange = async (key: 'earning' | 'users') => {
    if (key === 'earning') {
      referralMoneyEarningSearch();
    }
    if (key === 'users') {
      referralUserSearch();
    }
  };

  const content = (
    <div>
      <p>
        {`Refer a creator - get ${settings?.p2pReferralCommission * 100 || 0}% on the creator revenue`}
      </p>
      <p>
        {`Refer a fan - get ${settings?.p2uReferralCommission * 100 || 0}% on the fan spends for 1 year`}
      </p>
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>
          {ui && ui.siteName}
          {' '}
          | Referral Managed
        </title>
      </Head>
      <div className="main-container">
        <PageHeading title="Referral" icon={<GiftOutlined />} />
        <div className="page-referral">
          <div className="title">
            <h1>Refer A Friend</h1>
            <div className="info">
              <p>For each friend you refer you&apos;ll get commission</p>
              <Popover content={content}>
                <InfoCircleOutlined />
              </Popover>
            </div>
          </div>
          <ReferralLink linkReferral={linkReferral} loading={referralLoading} copyLink={copyLink} />
          <Divider />
          <ReferralStat stats={stats} />
          <Tabs defaultActiveKey="1" onChange={handlePageChange}>
            <Tabs.TabPane tab="Referrals" key="referrals">
              {paginationUser.total ? (
                <TableListReferralUser
                  rowKey="_id"
                  dataSource={listUsers}
                  loading={usersLoading}
                  onChange={handleTableUserChange}
                  pagination={paginationUser}
                />
              ) : <p className="no-found">No referrals were found</p>}
            </Tabs.TabPane>
            <Tabs.TabPane tab="Earning" key="earning">
              {paginationEarning.total ? (
                <TableListReferralEarning
                  rowKey="_id"
                  dataSource={listEarnings}
                  loading={earningLoading}
                  onChange={handleTableEarningChange}
                  pagination={paginationEarning}
                />
              ) : <p className="no-found">No revenue was found</p>}
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

export default ModelReferralPage;
