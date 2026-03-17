import Head from 'next/head';
import { PureComponent, createRef } from 'react';
import { Tabs, message } from 'antd';
import Page from '@components/common/layout/page';
import { AccountForm } from '@components/performer/AccountForm';
import PerformerOndatoDocument from '@components/performer/ondato-document';
import { SubscriptionForm } from '@components/performer/Subcription';
import { CommissionSettingForm } from '@components/performer/commission-setting';
import BankingForm from '@components/performer/BankingForm';
import {
  ICountry,
  ILangguges,
  IPhoneCodes,
  IPerformer,
  IBody
} from 'src/interfaces';
import { settingService } from '@services/setting.service';
import { authService, performerService } from '@services/index';
import Loader from '@components/common/base/loader';
import { utilsService } from '@services/utils.service';
import { UpdatePaswordForm } from '@components/user/update-password-form';
import { BreadcrumbComponent } from '@components/common';
import { omit } from 'lodash';

interface IProps {
  id: string;
  countries: ICountry[];
  languages: ILangguges[];
  phoneCodes: IPhoneCodes[];
  bodyInfo: IBody;
}
class PerformerUpdate extends PureComponent<IProps> {
  static async getInitialProps({ ctx }) {
    const [countries, languages, phoneCodes, bodyInfo] = await Promise.all([
      utilsService.countriesList(),
      utilsService.languagesList(),
      utilsService.phoneCodesList(),
      utilsService.bodyInfo()
    ]);
    return {
      countries: countries?.data || [],
      languages: languages?.data || [],
      phoneCodes: phoneCodes?.data || [],
      bodyInfo: bodyInfo?.data,
      ...ctx.query
    };
  }

  formRef = createRef() as any;

  state = {
    pwUpdating: false,
    updating: false,
    fetching: false,
    performer: {} as IPerformer,
    settingUpdating: false,
    siteCommission: {} as any,
    defaultActiveTab: 'basic'
  };

  componentDidMount() {
    this.getPerformer();
  }

  getPerformer = async () => {
    const { id } = this.props;
    try {
      this.setState({ fetching: true });
      const resp = await (await performerService.findById(id)).data as IPerformer;
      this.loadCommissionSetting();
      this.setState({
        performer: resp
      });
    } catch (e) {
      message.error('Error while fecting performer!');
    } finally {
      this.setState({ fetching: false });
    }
  }

  updatePassword = async (data: any) => {
    const { id } = this.props;
    try {
      this.setState({ pwUpdating: true });
      await authService.updatePassword(data.password, id, 'performer');
      message.success('Password has been updated!');
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      this.setState({ pwUpdating: false });
    }
  }

  updateCommissionSetting = async (data: any) => {
    const { id } = this.props;
    try {
      this.setState({ settingUpdating: true });
      await performerService.updateCommissionSetting(id, { ...data, performerId: id });
      message.success('Updated commission setting successfully!');
    } catch (error) {
      const err = await error;
      message.error(err?.message || 'An error occurred, please try again!');
    } finally {
      this.setState({ settingUpdating: false });
    }
  }

  updateBankingSetting = async (data: any) => {
    const { id } = this.props;
    try {
      this.setState({ settingUpdating: true });
      await performerService.updateBankingSetting(id, { ...data, performerId: id });
      message.success('Updated successfully!');
    } catch (error) {
      message.error('An error occurred, please try again!');
    } finally {
      this.setState({ settingUpdating: false });
    }
  }

  submit = async (data: any) => {
    const { id } = this.props;
    const { performer } = this.state;
    let newData = data;
    try {
      if (data.status === 'pending-email-confirmation') {
        newData = omit(data, ['status']);
      }
      this.setState({ updating: true });
      const updated = await performerService.update(id, {
        ...omit(performer, ['welcomeVideoId', 'welcomeVideoName', 'welcomeVideoPath']),
        ...newData
      });
      this.setState({ performer: updated.data });
      message.success('Updated successfully');
    } catch (e) {
      // TODO - exact error message
      const error = await e;
      message.error(error && (error.message || 'An error occurred, please try again!'));
    } finally {
      this.setState({ updating: false });
    }
  }

  async loadCommissionSetting() {
    const resp = (await settingService.all('commission')).data as any;
    if (!resp || !resp.length) {
      return;
    }
    const siteCommission = resp.reduce((obj, v) => ({
      ...obj,
      [v.key]: v.value
    }), {});

    this.setState({ siteCommission });
  }

  async loadOndatoData() {
    try {
      this.setState({ updating: true });
      const { performer } = this.state;
      await authService.loadOndatoIDV(performer?._id);
      message.success('Load Ondato and update model successfully!');
      this.getPerformer();
    } catch (error) {
      const e = await error;
      message.error(e?.message || 'An error occurred, please try again!');
    } finally {
      this.setState({ defaultActiveTab: 'document', updating: false });
    }
  }

  render() {
    const {
      pwUpdating, performer, updating, fetching, settingUpdating, siteCommission, defaultActiveTab
    } = this.state;
    const {
      countries, languages, bodyInfo, phoneCodes
    } = this.props;

    return (
      <>
        <Head>
          <title>Model update</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Models', href: '/model' },
            { title: performer?.name || performer?.username || '' },
            { title: 'Update' }
          ]}
        />
        <Page>
          {fetching ? (
            <Loader />
          ) : (
            <Tabs defaultActiveKey={defaultActiveTab} tabPosition="top">
              <Tabs.TabPane tab={<span>Basic Settings</span>} key="basic">
                <AccountForm
                  onFinish={this.submit.bind(this)}
                  performer={performer}
                  submiting={updating}
                  countries={countries}
                  languages={languages}
                  bodyInfo={bodyInfo}
                  phoneCodes={phoneCodes}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<span>ID Documents</span>} key="document">
                <PerformerOndatoDocument
                  performer={performer}
                  loadOndatoData={this.loadOndatoData.bind(this)}
                  loading={updating}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<span>Pricing</span>} key="subscription">
                <SubscriptionForm
                  submiting={updating}
                  onFinish={this.submit.bind(this)}
                  performer={performer}
                  siteCommission={siteCommission}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<span>Commission</span>} key="commission">
                <CommissionSettingForm
                  submiting={settingUpdating}
                  onFinish={this.updateCommissionSetting.bind(this)}
                  performer={performer}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<span>Banking</span>} key="sepa-banking">
                <BankingForm
                  updating={settingUpdating}
                  onFinish={this.updateBankingSetting.bind(this)}
                  initialValues={performer?.bankingInformation}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<span>Change password</span>} key="password">
                <UpdatePaswordForm onFinish={this.updatePassword.bind(this)} updating={pwUpdating} />
              </Tabs.TabPane>
            </Tabs>
          )}
        </Page>
      </>
    );
  }
}

export default PerformerUpdate;
