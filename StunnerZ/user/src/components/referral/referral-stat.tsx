import { IReferralStats } from '@interfaces/referral';
import { Statistic } from 'antd';
import './referral-stat.less';

interface IProps {
  stats: IReferralStats
}

function ReferralStat({ stats }: IProps) {
  return (
    <div className="starts-referral">
      <Statistic
        title="Referral Earnings"
        prefix="$"
        value={stats?.totalNetPrice || 0}
        precision={2}
      />
      <Statistic
        title="Total Referrals"
        value={stats?.totalRegisters || 0}
      />
      <Statistic
        title="Total Sales"
        value={stats?.totalSales || 0}
      />
    </div>
  );
}

export default ReferralStat;
