import { updateCurrentUser } from "@redux/user/actions";
import { performerService } from "@services/performer.service";
import { subAccountService } from "@services/sub-account.service";
import { userService } from "@services/user.service";
import { Button, Col, Layout, message, Modal, Radio, Row, Space } from "antd";
import Router from "next/router";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import "./account-manager-form.less";

type IProps = {
  performer: any;
  settings: any;
};
export default function AccountManagerForm({ performer, settings }: IProps) {
  const [openExternal, setOpenExternal] = useState(false);
  const [openAgency, setOpenAgency] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleUpdateAccount = async (valueChoose) => {
    try {
      setLoading(true);
      await performerService.updateManageAccount({
        by: valueChoose.toString(),
      });
      const user = await userService.me();
      dispatch(updateCurrentUser(user.data));
      setLoading(false);
      setOpenAgency(false);
      setOpenExternal(false);
      message.success("Account manager is updated", 10);
    } catch (error) {
      setLoading(false);
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  const handleExternalSubmit = () => {
    setOpenExternal(true);
  };

  const handleRedirectToAccount = async () => {
    const { data } = await subAccountService.getNameSubAccount();

    if (data === "Self Managed" || data === "StunnerZ Managed") {
      setOpenAgency(true);
      return;
    } else {
      const { data } = await subAccountService.search();
      if (data) {
        if (!data?.data[0]?._id) {
          window.location.href = "/creator/account/profile-management/create";
          return;
        }
        window.location.href = `/creator/account/profile-management?userId=${data?.data[0]?._id}`;
      } else {
        window.location.href = "/creator/account/profile-management/create";
      }
    }
  };

  return (
    <Layout>
      <div className="main-container">
        <h3 className="text-center">Setting Account Manager</h3>
        <br />
        <Row className="text-center">
          <Col xs={24} md={8} lg={8}>
            <Button
              style={{ width: "100%", height: "100px" }}
              value="self-managed"
              onClick={() => handleUpdateAccount("self-managed")}
              className={
                performer?.accountManager === "self-managed" ? "bg-choose" : ""
              }
            >
              Self Managed
            </Button>
          </Col>
          <Col xs={24} md={8} lg={8}>
            <Button
              value="stunnerZ-managed"
              onClick={handleExternalSubmit}
              className={
                performer?.accountManager === "stunnerZ-managed"
                  ? "bg-choose"
                  : ""
              }
              style={{ width: "100%", height: "100px" }}
            >
              {`StunnerZ Managed (${Math.ceil(
                settings?.accountManagerCommission * 100 || 0
              )}% commission)`}
            </Button>
          </Col>
          <Col xs={24} md={8} lg={8}>
            <Button
              value="agency-managed"
              onClick={handleRedirectToAccount}
              className={
                performer?.accountManager === "agency-managed"
                  ? "bg-choose"
                  : ""
              }
              style={{ width: "100%", height: "100px" }}
            >
              Setup External Agency
            </Button>
          </Col>
          {/* <Col xs={24} md={24} lg={24}>
            <Radio.Group
              defaultValue={
                performer ? performer?.accountManager : "self-managed"
              }
              buttonStyle="solid"
            >
              <Space>
                <Radio.Button value="self-managed" onClick={() => handleUpdateAccount('self-managed')}>Self Managed</Radio.Button>
                <Radio.Button value="stunnerZ-managed" onClick={handleExternalSubmit}>
                  {`StunnerZ Managed (${Math.ceil(
                    settings?.accountManagerCommission * 100 || 0
                  )}% commission)`}
                </Radio.Button>
                <Radio.Button
                  value="agency-managed"
                  onClick={handleRedirectToAccount}
                >
                  Setup External Agency
                </Radio.Button>
              </Space>
            </Radio.Group>
          </Col> */}
        </Row>
      </div>

      <Modal
        visible={openExternal}
        onCancel={() => setOpenExternal(false)}
        title="Do you want to change to a new agency account ?"
        onOk={handleUpdateAccount}
        footer={[
          <Button key="Reject" onClick={() => setOpenExternal(false)}>
            Reject
          </Button>,
          <Button
            key="Confirm"
            type="primary"
            loading={loading}
            onClick={() => handleUpdateAccount("stunnerZ-managed")}
          >
            Confirm
          </Button>,
        ]}
      />
      <Modal
        visible={openAgency}
        onCancel={() => setOpenAgency(false)}
        title="Do you want to change to a new agency account ?"
        onOk={handleUpdateAccount}
        footer={[
          <Button key="Reject" onClick={() => setOpenAgency(false)}>
            Reject
          </Button>,
          <Button
            key="Confirm"
            type="primary"
            loading={loading}
            onClick={() => handleUpdateAccount("agency-managed")}
          >
            Confirm
          </Button>,
        ]}
      />
    </Layout>
  );
}
