import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  message, Layout,
  PageHeader
} from 'antd';
import {
  IPerformer,
  IUIConfig,
  ICountry,
  IBody,
  ISettings
} from 'src/interfaces';
import {
  updatePerformer,
  updateCurrentUserAvatar,
  updateCurrentUserCover
} from 'src/redux/user/actions';
import NotifyBanner from '@components/common/notify-banner';
import {
  authService, performerService, utilsService
} from '@services/index';
import {
  PerformerAccountForm
} from '@components/performer';
import '../../user/index.less';
import Router from 'next/router';

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
class AccountSettings extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  // eslint-disable-next-line react/static-property-placement
  static defaultProps: IProps = {} as IProps;

  static async getInitialProps({ ctx }) {
    const [countries, bodyInfo] = await Promise.all([
      utilsService.countriesList(),
      utilsService.bodyInfo()
    ]);

    return {
      countries: countries?.data || [],
      bodyInfo: bodyInfo?.data,
      activeKey: ctx.query?.activeKey?.toString()
    };
  }

  _intervalCountdown: any;

  state = {
    emailSending: false,
    countTime: 60,
    ondatoVerifying: false
  };

  componentDidMount(): void {
    const { currentUser } = this.props;
    if(currentUser?.infoSubPerformer?._id && !currentUser?.infoBankSubPerformer){
      Router.push('/');
      return;
    }
    if (currentUser?.infoSubPerformer?._id && (!currentUser?.infoSubPerformer?.privilege.includes('all') && !currentUser?.infoSubPerformer?.privilege.includes('edit_profile'))) {
      Router.push('/');
      return;
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
      await this.setState({ ondatoVerifying: true });
      const body = {
        registration: {
          email: currentUser?.email
        },
        externalReferenceId: currentUser._id
      };
      const resp = await authService.ondatoCreation(body);
      if (resp?.data?.url) {
        Router.push(resp.data.url);
      } else message.error('An error occured, please try again later');
    } catch (e) {
      // const error = await e;
      // message.error(error?.message || 'An error occured, please try again later');
    } finally {
      this.setState({ ondatoVerifying: false });
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
      await this.setState({ emailSending: true });
      const resp = await authService.verifyEmail({
        sourceType: 'performer',
        source: currentUser
      });
      this.handleCountdown();
      resp.data && resp.data.message && message.success(resp.data.message);
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'An error occurred, please try again later');
    } finally {
      this.setState({ emailSending: false });
    }
  }

  render() {
    const {
      currentUser, updating, ui, countries, bodyInfo
    } = this.props;
    const { emailSending, countTime, ondatoVerifying } = this.state;
    const uploadHeaders = {
      authorization: authService.getToken()
    };

    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Edit Profile
          </title>
        </Head>
        <div className="main-container user-account">
          {!currentUser.completedAccount && (
            <NotifyBanner />
          )}
          <PageHeader onBack={() => Router.back()} title="Account Settings" />
          <PerformerAccountForm
            onFinish={this.submit.bind(this)}
            updating={updating || ondatoVerifying || emailSending}
            countTime={countTime}
            onVerifyEmail={this.verifyEmail.bind(this)}
            user={currentUser}
            options={{
              uploadHeaders,
              avatarUploadUrl: performerService.getAvatarUploadUrl(),
              onAvatarUploaded: this.onAvatarUploaded.bind(this),
              coverUploadUrl: performerService.getCoverUploadUrl(),
              onCoverUploaded: this.onCoverUploaded.bind(this),
              videoUploadUrl: performerService.getVideoUploadUrl()
            }}
            countries={countries}
            bodyInfo={bodyInfo}
          />
        </div>
      </Layout>
    );
  }
}

AccountSettings.defaultProps = {
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
export default connect(mapStates, mapDispatch)(AccountSettings);
