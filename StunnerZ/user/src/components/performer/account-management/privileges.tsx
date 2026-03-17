import Loader from "@components/common/base/loader";
import PrivilegesForm from "@components/performer/privileges-form";
import { isObjectId } from "@lib/utils";
import { subAccountService } from "@services/sub-account.service";
import { Button, InputNumber, Layout, message, Radio } from "antd";
import Router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import "./privilege.less";
import BarTitleHome from "@components/common/base/bar-title-home";

type IProps = {
  user: any;
  account: any;
};

export default function PrivilegesComponent({ user, account }: IProps) {
  const params = useRouter();
  const userId = params.query?.userId;
  const [privileges, setPrivileges] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inputCommission, setInputCommission] = useState(user?.commissionExternalAgency);
  const [chooseOption, setChooseOption] = useState(
    account?.setTypeCommissionAgency
  );
  const search = async () => {
    try {
      const resp = await subAccountService.searchAccountPrivileges({
        userId,
        limit: 20,
      });
      setPrivileges(resp.data.data);
    } catch (error) {
      const err = await Promise.resolve(error);
      message.error(err?.message || "Something went wrong, please try again.");
    } finally {
      setFetching(false);
    }
  };
  const submit = async (data: any[]) => {
    try {
      setUpdating(true);
      await Promise.all(
        data.map((item) =>
          subAccountService.grantPrivileges({
            userId,
            privilege: item?.privilege,
            commission: item?.commission,
          })
        )
      );
      message.success("Updated successfully");
      setUpdating(false);
      window.location.href = `/creator/account/profile-management?userId=${userId}&activeKey=privilege`;
    } catch (e) {
      setUpdating(false);
      const error = await e;
      message.error(
        error && (error.message || "An error occurred, please try again!")
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (item) => {
    if (item && isObjectId(item.id)) {
      try {
        setDeleting(true);
        await subAccountService.removePrivileges(item.id);
        message.success("Removed success!");
        setDeleting(false);
        window.location.href = `/creator/account/profile-management?userId=${userId}&activeKey=privilege`;
      } catch (e) {
        setDeleting(false);
        const error = await e;
        message.error(
          error && (error.message || "An error occurred, please try again!")
        );
      }
    }
  };

  const handleChangeTotalCommission = async () => {
    try {
      await subAccountService.changeTotalCommission({
        id: userId,
        commission: Number(inputCommission || user?.commissionExternalAgency) || 0,
      });
      message.success("Updated success!");
    } catch (error) {
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  useEffect(() => {
    if (user.accountManager !== "agency-managed") {
      Router.push("/");
    }
  }, []);

  useEffect(() => {
    search();
  }, []);

  return (
    <Layout>
      <div className="main-container">
        {fetching ? (
          <Loader />
        ) : (
          <>
            <div className="setup-choose-commission-privilege">
              <Radio.Group
                defaultValue={account?.setTypeCommissionAgency}
                onChange={(e) => setChooseOption(e.target.value)}
              >
                <Radio value="total">Total Net Commission</Radio>
                <Radio value="individual">Set Commission Individual</Radio>
              </Radio.Group>
            </div>
            {chooseOption === "total" && (
              <div className="setup-commission-privilege">
                <div className="setup-commission-privilege-details">
                  <InputNumber
                    onChange={(e) => setInputCommission(e)}
                    placeholder="Total commission ..."
                    defaultValue={user?.commissionExternalAgency}
                  />
                  <Button
                    className="secondary"
                    onClick={handleChangeTotalCommission}
                  >
                    Submit
                  </Button>
                </div>
                <br />
                <h4>Agency will have all privileges</h4>
              </div>
            )}
            {chooseOption === "individual" && (
              <PrivilegesForm
                onFinish={submit}
                onDelete={handleDelete}
                data={privileges}
                updating={updating}
                deleting={deleting}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
