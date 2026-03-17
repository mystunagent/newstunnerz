import { performerService } from "@services/performer.service";
import { message, Tabs } from "antd";
import { useEffect, useState } from "react";
import { getResponseError } from "@lib/utils";
import PerformerBankingForm from "./banking-form";

type IProps = {
  userId: string;
};

export default function BankingInfoSubPerformer({ userId }: IProps) {
  const [loadingBanking, setLoadingBanking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataBanking, setDataBanking] = useState<Record<string, any>>([]);
  const [activeTab, setActiveTab] = useState<string>("sepa-banking");

  const handleUpdateBanking = async (data: any) => {
    const alertMess = `
    The new bank details will be updated, replacing all previous bank information.
    The changes will be reviewed, and payments will be processed to the new account.
    `;

    if (!window.confirm(alertMess)) {
      return;
    }
    try {
      setLoadingBanking(true);
      const info = { ...data, performerId: userId.toString() };
      await performerService.updateBankingManageAccount(
        userId.toString(),
        info
      );
      message.success("Banking account was updated successfully!");
      setLoadingBanking(false);
      // window.location.reload();
    } catch (e) {
      setLoadingBanking(false);
      const err = await Promise.resolve(e);
      message.error(
        getResponseError(err) || "An error occurred, please try again!"
      );
    }
  };

  const loadBanking = async () => {
    try {
      setLoading(true);
      const data = await performerService.searchBankingInfo(userId.toString());
      setDataBanking(data);
      setActiveTab(data?.data?.type);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const err = await Promise.resolve(error);
      message.error(
        getResponseError(err) || "An error occurred, please try again!"
      );
    }
  };

  useEffect(() => {
    loadBanking();
  }, []);

  return (
    <div className="main-container">
      {!loading && (
        <Tabs
          defaultActiveKey={
            activeTab === "sepa"
              ? "sepa-banking"
              : activeTab === "wire" && "wire-banking"
          }
          tabPosition="top"
          onChange={(tab) => setActiveTab(tab)}
        >
          <Tabs.TabPane tab="European and UK Bank Transfer" key="sepa-banking">
            <PerformerBankingForm
              onFinish={handleUpdateBanking.bind(this)}
              updating={loadingBanking}
              bankingType="sepa"
              initialValues={dataBanking.data}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="International Wire Transfer" key="wire-banking">
            <PerformerBankingForm
              onFinish={handleUpdateBanking.bind(this)}
              updating={loadingBanking}
              bankingType="wire"
              initialValues={dataBanking.data}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Bitsafe" key="bitsafe-banking">
            <PerformerBankingForm
              onFinish={handleUpdateBanking.bind(this)}
              updating={loadingBanking}
              bankingType="bitsafe"
              initialValues={null}
            />
          </Tabs.TabPane>
        </Tabs>
      )}
    </div>
  );
}
