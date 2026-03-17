import { DropdownAction } from "@components/common";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { formatDateNotSecond } from "@lib/date";
import { availableTimeStreamService } from "@services/available-time.service";
import { Button, Layout, message, Modal, PageHeader, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import UploadTimeStream from "@components/available-time/form-upload";
import { connect } from "react-redux";
import Head from "next/head";
import Router from "next/router";
import dynamic from "next/dynamic";
import CreateFormTimeStream from "@components/available-time/form-upload-create";
import moment from "moment";
import "./index.less";

const FormFilterAvailableTime = dynamic(
  () => import("@components/available-time/form-filter")
);

type IProps = {
  ui: any;
  currentUser: any;
};
function AvailableTimeStream({ ui, currentUser }: IProps) {
  const perPage = 10;
  const [idUpdate, setIdUpdate] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [openModalCreate, setOpenModalCreate] = useState(false);
  const [openModelUpdate, setOpenModalUpdate] = useState(false);
  const [dataTimeIte, setDataTimeItem] = useState<any>();
  const [dataTimeStream, setDataTimeStream] = useState<Record<string, any>>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(perPage || 10);
  const [updatedFilter, setUpdatedFilter] = useState<any>();

  const handleLoadDate = async (p: number = 1, l = limit, update?: any) => {
    try {
      setLoadingData(true);
      const { data } = await availableTimeStreamService.myList({
        ...update,
        limit: l,
        offset: l * ((p || page) - 1),
      });
      setDataTimeStream(data);
      setLoadingData(false);
    } catch (error) {
      setLoadingData(false);
      const e = await error;
      message.error(e.message || "An error occurred while loading");
    }
  };

  const onPageChange = (pagination: any) => {
    setPage(pagination.current);
    handleLoadDate(pagination.current, limit, updatedFilter);
  };

  const onShowSizeChange = (p: number, lm: number) => {
    setLimit(lm);
    handleLoadDate(p, lm, updatedFilter);
  };
  const handleDeleteTime = async (id: string) => {
    try {
      await availableTimeStreamService.myDelete(id.toString());
      message.success("Deleted successfully");
      handleLoadDate();
    } catch (error) {
      const e = await error;
      message.error(e.message || "An error occurred while loading");
    }
  };

  const onFilter = async (filter: string) => {
    setUpdatedFilter(filter);
    handleLoadDate(page, limit, filter);
  };

  const handleCreate = async (data: any) => {
    try {
      setLoadingCreate(true);
      await availableTimeStreamService.myCreate(data);
      message.success("Created successfully");
      setLoadingCreate(false);
      setOpenModalCreate(false);
      await handleLoadDate();
    } catch (error) {
      setLoadingCreate(false);
      const e = await error;
      message.error(e.message || "An error occurred while loading");
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      setLoadingCreate(true);
      await availableTimeStreamService.myUpdate(idUpdate.toString(), data);
      message.success("Updated successfully");
      setLoadingCreate(false);
      setOpenModalUpdate(false);
      await handleLoadDate();
    } catch (error) {
      setLoadingCreate(false);
      const e = await error;
      message.error(e.message || "An error occurred while loading");
    }
  };

  const columns = [
    {
      title: "Start At",
      dataIndex: "startAt",
      width: 130,
      render(startAt) {
        return <span>{formatDateNotSecond(startAt)}</span>;
      },
    },
    {
      title: "End At",
      dataIndex: "endAt",
      width: 130,
      render(endAt) {
        return <span>{formatDateNotSecond(endAt)}</span>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render(status, payload) {
        const startAt = new Date(payload.startAt);
        const now = new Date();
        if (moment(now.toISOString()).isAfter(startAt.toISOString())) {
          return <Tag color="red">Expired</Tag>;
        }
        switch (status) {
          case "active":
            return <Tag color="green">Active</Tag>;
          case "inactive":
            return <Tag color="red">Inactive</Tag>;
          case "booked":
            return <Tag color="purple">Booked</Tag>;
          default:
            <Tag color="yellow">{status}</Tag>;
        }
      },
    },
    {
      title: "Updated On",
      dataIndex: "updatedAt",
      sorter: true,
      width: 130,
      render(date: Date) {
        return <span>{formatDateNotSecond(date)}</span>;
      },
    },
    {
      title: "Action",
      dataIndex: "_id",
      render: (id: string, data: any) => (
        <>
          {moment(new Date(data.startAt).toISOString()).isAfter(
            new Date().toISOString()
          ) && (
            <>
              <DropdownAction
                menuOptions={[
                  {
                    key: "update",
                    name: "Update",
                    children: (
                      <span>
                        <EditOutlined /> Update
                      </span>
                    ),
                    onClick: () => {
                      setOpenModalUpdate(true);
                      setIdUpdate(id);
                      setDataTimeItem(data);
                    },
                  },
                  {
                    key: "delete",
                    name: "Delete",
                    children: (
                      <span>
                        <DeleteOutlined /> Delete
                      </span>
                    ),
                    onClick: () => handleDeleteTime(id),
                  },
                ]}
              />
            </>
          )}
        </>
      ),
    },
  ];

  useEffect(() => {
    if (
      currentUser?.infoSubPerformer?._id &&
      !currentUser?.infoBankSubPerformer
    ) {
      Router.push("/");
      return;
    }
    if (
      currentUser?.infoSubPerformer?._id &&
      !currentUser?.infoSubPerformer?.privilege.includes("all") &&
      !currentUser?.infoSubPerformer?.privilege.includes("available_time")
    ) {
      Router.push("/");
      return;
    }
  }, []);

  return (
    <Layout className="main-container">
      <Head>
        <title>{ui && ui.siteName} | Available Time</title>
      </Head>
      <div className="title-available-time">
        <PageHeader onBack={() => Router.back()} title="Available Time" />
        <PageHeader
          className="title-link-back"
          backIcon={<ArrowRightOutlined />}
          onBack={() => Router.push("/creator/book-stream/private")}
          title="My Private Stream Bookings"
        />
      </div>
      <div>
        <FormFilterAvailableTime onFilter={onFilter} />
      </div>
      <div style={{ margin: "10px 0" }}>
        <Button type="primary" onClick={() => setOpenModalCreate(true)}>
          Create Time
        </Button>
      </div>
      <>
        <Table
          className="ant-border-space"
          columns={columns}
          dataSource={dataTimeStream?.data}
          loading={loadingData}
          pagination={{
            pageSize: limit,
            total: dataTimeStream?.total,
            onShowSizeChange,
          }}
          onChange={onPageChange}
          rowKey="_id"
        />
      </>
      <Modal
        visible={openModalCreate}
        footer={false}
        title="Create Time Available Stream"
        onCancel={() => setOpenModalCreate(false)}
        maskClosable={false}
        width={500}
      >
        <CreateFormTimeStream onSubmit={handleCreate} loading={loadingCreate} />
      </Modal>
      <Modal
        visible={openModelUpdate}
        footer={false}
        title="Update Time Available Stream"
        onCancel={() => setOpenModalUpdate(false)}
        maskClosable={false}
        width={460}
      >
        {dataTimeIte && (
          <UploadTimeStream
            data={dataTimeIte}
            onSubmit={handleUpdate}
            loading={loadingCreate}
          />
        )}
      </Modal>
    </Layout>
  );
}
const mapStates = (state: any) => ({
  ui: state.ui,
  currentUser: state.user.current,
});
const mapDispatch = {};
AvailableTimeStream.isPerformer = true;
export default connect(mapStates, mapDispatch)(AvailableTimeStream);
