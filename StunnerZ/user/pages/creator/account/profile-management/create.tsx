import { ArrowLeftOutlined } from "@ant-design/icons";
import { PerformerSubAccountForm } from "@components/performer/sub-account-form";
import { getResponseError } from "@lib/utils";
import { authService } from "@services/index";
import { subAccountService } from "@services/sub-account.service";
import { Layout, message, Modal, PageHeader } from "antd";
import { isBoolean } from "lodash";
import Head from "next/head";
import Router from "next/router";
import { useEffect, useState } from "react";
import { connect } from "react-redux";

type IProps = {
  user: any;
  ui: any;
};

function ModelCreateSubAccount({ user, ui }: IProps) {
  const [updating, setUpdating] = useState(false);
  const [showPopUp, setShowPopup] = useState(false);
  const [submit, setSubmit] = useState(false);
  const [formData, setFormData] = useState({});

  const create = async (payload) => {
    const datas = {
      ...payload,
      commissionExternalAgency: Number(payload?.commissionExternalAgency || 0),
      setTypeCommissionAgency: payload?.setTypeCommissionAgency || "individual",
    };
    try {
      if (submit) {
        setUpdating(true);
        const { data } = await subAccountService.switchAccount(datas);
        // if (payload.setTypeCommissionAgency === 'individual') {
        //   await Promise.all(
        //     Object.entries(payload?.formData).map(([privilege, commission]) =>
        //       subAccountService.grantPrivileges({ userId: data?._id, privilege, commission })
        //     )
        //   );
        // }
        message.success("Switch Account Successfully");
        setUpdating(false);
        setSubmit(false);
        Router.push(`/creator/account/profile-management?userId=${data?._id}`);
      }
    } catch (e) {
      setUpdating(false);
      setSubmit(false);
      const err = await Promise.resolve(e);
      message.error(
        getResponseError(err) || "An error occurred, please try again!"
      );
    } finally {
      setUpdating(false);
      setSubmit(false);
    }
  };

  const handleFormSubmit = (data) => {
    setFormData(data);
    setShowPopup(true);
  };

  useEffect(() => {
    if (user?.infoSubPerformer?._id) {
      Router.push("/");
      return;
    }
    if (user.accountManager !== "agency-managed") {
      Router.push("/");
      return;
    }
  }, []);

  useEffect(() => {
    if (submit) {
      create(formData);
    }
  }, [submit]);

  return (
    <Layout>
      <Head>{ui && ui.siteName} | Create Agency Account Management</Head>
      <div className="main-container">
        <div className="header-page">
          <PageHeader
            onBack={() => Router.back()}
            backIcon={<ArrowLeftOutlined />}
            title="New Agency Account Management"
          />
        </div>
        <PerformerSubAccountForm
          onFinish={handleFormSubmit}
          updating={updating}
          privileges={[]}
        />
      </div>
      <Modal
        width={460}
        title={`Do you want to change to a new agency account ?`}
        onCancel={() => Router.push("/creator/account/manager")}
        onOk={() => {
          setSubmit(true);
          setShowPopup(false);
        }}
        visible={showPopUp}
        centered
        maskClosable={false}
      ></Modal>
    </Layout>
  );
}

ModelCreateSubAccount.authenticate = true;
ModelCreateSubAccount.onlyPerformer = true;

const mapStates = (state: any) => ({
  ui: state.ui,
  user: state.user.current,
});
export default connect(mapStates)(ModelCreateSubAccount);
