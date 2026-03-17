import React from "react";
import Head from "next/head";
import PayoutRequestForm from "@components/payout-request/form";
import { message, Layout } from "antd";
import { NotificationOutlined } from "@ant-design/icons";
import PageHeading from "@components/common/page-heading";
import { payoutRequestService } from "src/services";
import { IUIConfig, PayoutRequestInterface, IPerformer } from "src/interfaces";
import nextCookie from "next-cookies";
import Router from "next/router";
import { connect } from "react-redux";

interface Props {
  ui: IUIConfig;
  user: IPerformer;
}

interface States {
  submiting: boolean;
  payout: PayoutRequestInterface;
  statsPayout: {
    totalEarnedTokens: number;
    previousPaidOutTokens: number;
    remainingUnpaidTokens: number;
  };
}

class SubPerformerPayoutRequestUpdatePage extends React.PureComponent<
  Props,
  States
> {
  static authenticate = true;

  static onlyPerformer = true;

  constructor(props: Props) {
    super(props);
    this.state = {
      submiting: false,
      statsPayout: {
        totalEarnedTokens: 0,
        previousPaidOutTokens: 0,
        remainingUnpaidTokens: 0,
      },
      payout: null,
    };
  }

  componentDidMount() {
    this.getDetail();
    this.calculateStatsPayout();
  }

  getDetail = async () => {
    const { user } = this.props;
    const key = Router.query?.id;
    try {
      const resp = await payoutRequestService.subDetail(key.toString(), {
        sourceId: user?.infoSubPerformer?._id,
      });
      this.setState({ payout: resp.data });
    } catch {
      message.error("Something went wrong. Please try to again later!");
    }
  };

  calculateStatsPayout = async () => {
    const { user } = this.props;
    try {
      const resp = await payoutRequestService.subPerformerCalculate({
        sourceId: user?.infoSubPerformer?._id,
      });
      this.setState({ statsPayout: resp.data });
    } catch {
      message.error("Something went wrong. Please try to input date again!");
    }
  };

  async submit(data: any) {
    const { user } = this.props;
    const { payout } = this.state;
    if (["done", "approved", "rejected"].includes(payout.status)) {
      message.error("Please recheck request payout status");
      return;
    }
    if (data.requestTokens > user.balance) {
      message.error(
        "Requested amount must be less than or equal your wallet balance"
      );
      return;
    }
    try {
      await this.setState({ submiting: true });
      const body = {
        paymentAccountType: data?.paymentAccountType,
        requestTokens: data?.requestTokens,
        requestNote: data?.requestNote,
        source: "sub_performer",
        sourceId: user?.infoSubPerformer?._id,
      };
      await payoutRequestService.subUpdate(payout._id, body);
      message.success("Changes saved!");
      Router.push("/sub-performer/payout-request");
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error?.message || "Error occurred, please try again later");
      this.setState({ submiting: false });
    }
  }

  render() {
    const { ui } = this.props;
    const { payout, submiting, statsPayout } = this.state;
    console.log(payout);
    return (
      <Layout>
        <Head>
          <title>{`${ui?.siteName} | Edit Payout Request`}</title>
        </Head>
        <div className="main-container">
          <PageHeading
            title="Edit Payout Request"
            icon={<NotificationOutlined />}
          />
          {payout && (
            <PayoutRequestForm
              statsPayout={statsPayout}
              payout={payout}
              submit={this.submit.bind(this)}
              submiting={submiting}
            />
          )}
        </div>
      </Layout>
    );
  }
}

const mapStateToProps = (state) => ({
  ui: state.ui,
  user: state.user.current,
});

export default connect(mapStateToProps)(SubPerformerPayoutRequestUpdatePage);
