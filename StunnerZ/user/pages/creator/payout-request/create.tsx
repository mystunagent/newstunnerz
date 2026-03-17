import React from "react";
import Head from "next/head";
import { NotificationOutlined } from "@ant-design/icons";
import PageHeading from "@components/common/page-heading";
import PayoutRequestForm from "@components/payout-request/form";
import { message, Layout } from "antd";
import { connect } from "react-redux";
import { payoutRequestService } from "src/services";
import Router from "next/router";
import { IUIConfig, IPerformer } from "src/interfaces/index";

interface Props {
  ui: IUIConfig;
  user: IPerformer;
}

interface States {
  submiting: boolean;
  statsPayout: {
    totalEarnedTokens: number;
    previousPaidOutTokens: number;
    remainingUnpaidTokens: number;
  };
}

class PayoutRequestCreatePage extends React.PureComponent<Props, States> {
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
    };
  }

  componentDidMount() {
    const { user } = this.props;
    if (user?.infoSubPerformer?._id && !user?.infoBankSubPerformer) {
      Router.push("/");
      return;
    }
    if (
      user?.infoSubPerformer?._id &&
      !user?.infoSubPerformer?.privilege.includes("all") &&
      !user?.infoSubPerformer?.privilege.includes("payout_request")
    ) {
      Router.push("/");
      return;
    }
    this.calculateStatsPayout();
  }

  calculateStatsPayout = async () => {
    const { user } = this.props;
    const resp = await payoutRequestService.calculate(user?.isPerformer);
    resp?.data && this.setState({ statsPayout: resp.data });
  };

  async submit(data) {
    const { user } = this.props;
    if (data.requestTokens > user.balance) {
      message.error(
        "Requested amount must be less than or equal your wallet balance"
      );
      return;
    }
    // hide payout request
    return;
    try {
      await this.setState({ submiting: true });
      const body = { ...data, source: "performer" };
      await payoutRequestService.create(body);
      message.success("Your payout request was sent!");
      Router.push("/creator/payout-request");
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error?.message || "Error occured, please try again later");
      this.setState({ submiting: false });
    }
  }

  render() {
    const { submiting, statsPayout } = this.state;
    const { ui } = this.props;
    return (
      <Layout>
        <Head>
          <title>{`${ui?.siteName} | Request Token Payout`}</title>
        </Head>
        <div className="main-container">
          <PageHeading
            title="Request Token Payout"
            icon={<NotificationOutlined />}
          />
          <PayoutRequestForm
            payout={{
              requestNote: "",
              requestTokens: 1,
              status: "pending",
            }}
            statsPayout={statsPayout}
            submit={this.submit.bind(this)}
            submiting={submiting}
          />
        </div>
      </Layout>
    );
  }
}

const mapStateToProps = (state) => ({
  ui: state.ui,
  user: state.user.current,
});

export default connect(mapStateToProps)(PayoutRequestCreatePage);
