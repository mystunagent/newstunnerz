import { Layout, message, Statistic } from "antd";
import Head from "next/head";
import { DollarOutlined } from "@ant-design/icons";
import PageHeading from "@components/common/page-heading";
import { useEffect, useState } from "react";
import { earningService } from "@services/earning.service";
import { connect } from "react-redux";
import TableListAgencyEarning from "@components/performer/table-agency-earning";

type IProps = {
  user: any;
  ui: any;
};

function EarningSubPerformer({ user, ui }: IProps) {
  const [agencyData, setAgencyData] = useState();
  const [loading, setLoading] = useState(false);
  const [agencyStats, setAgencyStats] = useState<Record<string, any>>();
  const [filterQuery, setFilterQuery] = useState({
    limit: 10,
    offset: 0
  });
	const [pagination, setPagination] = useState({
    total: 0,
    pageSize: 10
  });
  const handleLoadStats = async () => {
    try {
      const { data } = await earningService.subPerformerStats({
        subPerformerId: user?.infoSubPerformer?._id,
      });
      setAgencyStats(data);
    } catch (error) {
      const e = await error;
      message.error(e?.message || "An error occurred");
    }
  };

  const loadDataEarning = async () => {
    try {
      setLoading(true);
      const { data } = await earningService.subPerformerSearchEarning({
        subPerformerId: user?.infoSubPerformer?._id,
				...filterQuery
      });
      setPagination((values) => ({ ...values, total: data?.total }));

      setAgencyData(data?.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const e = await error;
      message.error(e?.message || "An error occurred");
    }
  };

	const onChange = (data: any) => {
    setPagination(data);
    setFilterQuery((query) => ({
      ...query,
      offset: (data.current - 1) * data.pageSize
    }));
  };

  useEffect(() => {
    handleLoadStats();
  }, []);

	useEffect(() => {
    loadDataEarning();
  }, [filterQuery]);

  return (
    <Layout>
      <Head>
        <title>{`${ui?.siteName} | Agency Earnings`}</title>
      </Head>

      <div className="main-container">
        <PageHeading icon={<DollarOutlined />} title="Agency Earnings" />

        <div className="stats-earning">
          <Statistic
            title="Total"
            prefix="$"
            value={agencyStats?.totalGrossPrice?.toFixed(2) || 0}
            precision={2}
          />
          <Statistic
            title="Your Earnings"
            prefix="$"
            value={agencyStats?.totalNetPrice?.toFixed(2) || 0}
            precision={2}
          />
          <Statistic
            title="Total Paid"
            prefix="$"
            value={agencyStats?.totalPaidAmount?.toFixed(2) || 0}
            precision={2}
          />
          <Statistic
            title="Total Unpaid"
            prefix="$"
            value={agencyStats?.totalUnpaidAmount?.toFixed(2) || 0}
            precision={2}
          />
        </div>
        <div className="table-responsive">
          <TableListAgencyEarning
            dataSource={agencyData}
            rowKey="_id"
            pagination={pagination}
            loading={loading}
            onChange={onChange}
          />
        </div>
      </div>
    </Layout>
  );
}

EarningSubPerformer.authenticate = true;

EarningSubPerformer.onlyPerformer = true;

const mapStates = (state: any) => ({
  ui: state.ui,
  user: state.user.current,
});

export default connect(mapStates)(EarningSubPerformer);
