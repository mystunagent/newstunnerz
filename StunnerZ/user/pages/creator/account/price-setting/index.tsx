import NotifyBanner from '@components/common/notify-banner';
import { PerformerSubscriptionForm } from '@components/performer';
import { IPerformer } from '@interfaces/performer';
import { ISettings } from '@interfaces/setting';
import { IUIConfig } from '@interfaces/ui-config';
import { ICountry, IBody } from '@interfaces/utils';
import { updatePerformer, updateCurrentUserAvatar, updateCurrentUserCover } from '@redux/user/actions';
import { authService } from '@services/auth.service';
import { message, Layout, PageHeader } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

interface IProps {
  settings: ISettings;
  currentUser: IPerformer;
  updatePerformer: Function;
  updating: boolean;
  updateCurrentUserAvatar: Function;
  ui: IUIConfig;
  updateCurrentUserCover: Function;
  countries: ICountry[];
  bodyInfo: IBody;
  activeKey: string;
}
class PricingAccountSettings extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  // eslint-disable-next-line react/static-property-placement
  static defaultProps: IProps = {} as IProps;

  _intervalCountdown: any;

  state = {
    countTime: 60
  };

  componentDidMount(): void {
    const { currentUser } = this.props;
    if (currentUser?.infoSubPerformer?._id && (!currentUser?.infoSubPerformer?.privilege.includes('all') && !currentUser?.infoSubPerformer?.privilege.includes('edit_profile'))) {
      Router.push('/');
    }
  }

  handleCountdown = async () => {
    const { countTime } = this.state;
    if (countTime === 0) {
      clearInterval(this._intervalCountdown);
      this.setState({ countTime: 60 });
      return;
    }
    this.setState({ countTime: countTime - 1 });
    this._intervalCountdown = setInterval(this.coundown.bind(this), 1000);
  };

  onAvatarUploaded(data: any) {
    const { updateCurrentUserAvatar: handleUpdateAvt } = this.props;
    message.success('Changes saved');
    handleUpdateAvt(data.response.data.url);
  }

  onCoverUploaded(data: any) {
    const { updateCurrentUserCover: handleUpdateCover } = this.props;
    message.success('Changes saved');
    handleUpdateCover(data.response.data.url);
  }

  async ondatoGenerateIDV() {
    const { currentUser } = this.props;
    try {
      const body = {
        registration: {
          email: currentUser?.email
        },
        externalReferenceId: currentUser._id
      };
      const resp = await authService.ondatoCreation(body);
      if (resp?.data?.url) {
        Router.push(resp.data.url);
      } else message.error('An error occurred, please try again later');
    } catch (e) {
      // const error = await e;
      // message.error(error?.message || 'An error occured, please try again later');
    }
  }

  coundown() {
    const { countTime } = this.state;
    this.setState({ countTime: countTime - 1 });
  }

  async submit(data: any) {
    const { currentUser, updatePerformer: handleUpdatePerformer } = this.props;
    if (!currentUser?.verifiedDocument) {
      this.ondatoGenerateIDV();
    }
    handleUpdatePerformer({
      ...currentUser,
      ...data
    });
  }

  async verifyEmail() {
    const { currentUser } = this.props;
    try {
      const resp = await authService.verifyEmail({
        sourceType: 'performer',
        source: currentUser
      });
      this.handleCountdown();
      resp.data && resp.data.message && message.success(resp.data.message);
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'An error occurred, please try again later');
    }
  }

  render() {
    const {
      currentUser, updating, ui, settings
    } = this.props;

    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Pricing Account
          </title>
        </Head>
        <div className="main-container user-account">
          {!currentUser.completedAccount && (
            <NotifyBanner />
          )}
          <PageHeader onBack={() => Router.back()} title="Pricing Settings" />
          <PerformerSubscriptionForm
            onFinish={this.submit.bind(this)}
            updating={updating}
            user={currentUser}
            transactionCost={settings.transactionCost || 0.04}
          />

        </div>
      </Layout>
    );
  }
}

PricingAccountSettings.defaultProps = {
  updating: false
} as IProps;

const mapStates = (state: any) => ({
  currentUser: state.user.current,
  updating: state.user.updating,
  ui: state.ui,
  settings: state.settings
});
const mapDispatch = {
  updatePerformer,
  updateCurrentUserAvatar,
  updateCurrentUserCover
};
export default connect(mapStates, mapDispatch)(PricingAccountSettings);
