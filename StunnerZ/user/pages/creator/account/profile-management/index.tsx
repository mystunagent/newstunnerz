import Loader from "@components/common/base/loader";
import PrivilegesComponent from "@components/performer/account-management/privileges";
import { PerformerSubAccountForm } from "@components/performer/sub-account-form";
import { SwitchPerformerSubAccountForm } from "@components/performer/switch-sub-account-form";
import { UpdatePaswordForm } from "@components/user/update-password-form";
import { getResponseError } from "@lib/utils";
import { updateCurrentUserAvatar } from "@redux/user/actions";
import { authService, subAccountService, userService } from "@services/index";
import { Layout, message, PageHeader, Tabs } from "antd";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { connect } from "react-redux";

type IProps = {
  user: any;
  ui: any;
  updateCurrentUserAvatar: any;
};

function AccountManagementPage({
  user,
  ui,
  updateCurrentUserAvatar: updateAvatar,
}: IProps) {
  const params = useRouter();
  const userId = params.query?.userId;
  const activeKey = params.query?.activeKey;
  const [fetching, setFetching] = useState(true);
  const [fetchingPri, setFetchingPri] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingPwd, setUpdatingPwd] = useState(false);
  const [account, setAccount] = useState(null);
  const [activeTab, setActiveTab] = useState("account");
  const [privileges, setPrivileges] = useState([]);

  const updatePassword = async (data: any) => {
    try {
      setUpdatingPwd(true);
      await authService.updateSubAccountPassword(
        data.password,
        userId.toString(),
        "sub_performer"
      );
      message.success("Password has been updated!");
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(
        getResponseError(err) || "An error occurred, please try again!"
      );
    } finally {
      setUpdatingPwd(false);
    }
  };
  const uploadAvatar = async (data) => {
    updateAvatar(data.response.data.url);
  };

  const onUpdate = async (payload) => {
    const data = {
      ...payload,
      commissionExternalAgency: Number(payload?.commissionExternalAgency || 0),
    };
    try {
      setUpdating(true);
      await subAccountService.update(userId.toString(), data);
      // if (payload.setTypeCommissionAgency === "individual") {
      //   await Promise.all(
      //     Object.entries(payload?.formData).map(([privilege, commission]) =>
      //       subAccountService.grantPrivileges({ userId, privilege, commission })
      //     )
      //   );
      // }
      message.success("Updated successfully");
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(
        getResponseError(err) || "An error occurred, please try again!"
      );
    } finally {
      setUpdating(false);
    }
  };

  const getData = async () => {
    try {
      setFetching(true);
      const resp = await subAccountService.findById(userId.toString());
      setAccount(resp.data);
      setFetching(false);
    } catch (e) {
      setFetching(false);
      const err = await Promise.resolve(e);
      message.error(
        getResponseError(err) || "An error occurred, please try again!"
      );
    } finally {
      setFetching(false);
    }
  };

  const searchPrivileges = async () => {
    try {
      setFetchingPri(true);
      const resp = await subAccountService.searchAccountPrivileges({
        userId,
        limit: 20,
      });
      setPrivileges(resp.data.data);
      setFetchingPri(false);
    } catch (error) {
      setFetchingPri(false);
      const err = await Promise.resolve(error);
      message.error(err?.message || "Something went wrong, please try again.");
    } finally {
      setFetchingPri(false);
    }
  };

  useEffect(() => {
    if (!user || !user.isPerformer) {
      Router.push("/");
      return;
    }
    if (user?.infoSubPerformer?._id) {
      Router.push("/");
      return;
    }
    if (activeKey) {
      setActiveTab(activeKey.toString());
    }
    getData();
    searchPrivileges();
  }, []);

  const uploadHeader = {
    authorization: authService.getToken(),
  };

  return (
    <Layout>
      <Head>
        <title>{ui && ui.siteName} | Agency Account Management</title>
      </Head>
      <div className="main-container">
        <PageHeader
          title="Agency Account Management"
          onBack={() => Router.back()}
        />
        {fetching ? (
          <Loader />
        ) : (
          <Tabs defaultActiveKey={activeTab}>
            <Tabs.TabPane tab="Setup Agency Account" key="account">
              <PerformerSubAccountForm
                onFinish={onUpdate.bind(this)}
                account={account}
                updating={updating}
                privileges={privileges}
                options={{
                  uploadHeader,
                  avatarUrl: userService.getAvatarSubUploadUrl(
                    account?._id?.toString()
                  ),
                  uploadAvatar,
                }}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Setup Password" key="password">
              <UpdatePaswordForm
                onFinish={updatePassword.bind(this)}
                updating={updatingPwd}
              />
            </Tabs.TabPane>
            {/* <Tabs.TabPane tab={<span>Update Banking For Managed</span>} key="banking">
              <BankingInfoSubPerformer userId={userId?.toString()} />
            </Tabs.TabPane> */}
            <Tabs.TabPane tab="Setup Privilege" key="privilege">
              <PrivilegesComponent user={user} account={account} />
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={
                <a href="/creator/account/profile-management/create">
                  Switch Agency Account
                </a>
              }
              key="switch_account"
            >
              {/* <SwitchPerformerSubAccountForm
                onFinish={handleSwitchAccount.bind(this)}
                account={account}
                updating={updating}
                options={{
                  uploadHeader,
                  avatarUrl: userService.getAvatarSubUploadUrl(account?._id?.toString()),
                  uploadAvatar
                }}
              /> */}
            </Tabs.TabPane>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}

const mapStates = (state: any) => ({
  user: { ...state.user.current },
  ui: { ...state.ui },
  updating: state.user.updating,
  updateSuccess: state.user.updateSuccess,
  settings: { ...state.settings },
});
const mapDispatch = {
  updateCurrentUserAvatar,
};
export default connect(mapStates, mapDispatch)(AccountManagementPage);
