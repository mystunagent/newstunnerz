/* eslint-disable no-plusplus */
// import { useState } from 'react';
import { upcomingStreamService } from "@services/upcoming-stream.service";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Radio,
  Row,
  Switch,
} from "antd";
import moment from "moment";
import Router from "next/router";
import { useState } from "react";
import { IPerformer } from "src/interfaces";
import "./private-streaming-container.less";

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

interface IProps {
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
  // eslint-disable-next-line react/require-default-props
  dataUpcomingStream?: any;
}

const { RangePicker } = DatePicker;

const StreamPriceForm = ({
  onFinish,
  submiting,
  performer,
  dataUpcomingStream,
}: IProps) => {
  const [openTime, setOpenTime] = useState(!!dataUpcomingStream._id);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [startDate, setStartDate] = useState(dataUpcomingStream?.startAt);
  const [endDate, setEndDate] = useState(dataUpcomingStream?.endAt);
  const [optionStream, setOptionStream] = useState(
    dataUpcomingStream?.optionStream || "subscribe"
  );

  const submit = async (formValues) => {
    const payload = { ...formValues };
    payload.optionStream = optionStream;
    payload.price = payload.price ? payload.price : 0;
    if (openTime === true) {
      if (!startDate || !endDate) {
        message.error("Please choose the time");
        return;
      }
      if (dataUpcomingStream && dataUpcomingStream._id) {
        try {
          setLoadingSubmit(true);
          await upcomingStreamService.update(dataUpcomingStream._id, {
            ...payload,
            description: "",
            startAt: startDate,
            endAt: endDate,
          });
          message.success(
            "Updated Successfully. You will redirect to schedule page after 3 seconds"
          );
          setLoadingSubmit(false);
        } catch (error) {
          setLoadingSubmit(false);
          const e = await error;
          message.error(e.message || "An error occurred");
          return;
        }
      } else {
        try {
          setLoadingSubmit(true);
          await upcomingStreamService.create({
            ...payload,
            description: "",
            startAt: startDate,
            endAt: endDate,
          });
          message.success(
            "Created Successfully. You will redirect to schedule page after 3 seconds"
          );
          setLoadingSubmit(false);
        } catch (error) {
          setLoadingSubmit(false);
          const e = await error;
          message.error(e.message || "An error occurred");
          return;
        }
      }
      setTimeout(() => {
        Router.push("/creator/book-stream");
      }, 3000);
    } else {
      onFinish(payload);
    }
  };

  const handleDelete = async () => {
    try {
      setLoadingDelete(true);
      await upcomingStreamService.delete(dataUpcomingStream._id);
      setLoadingDelete(false);
      message.success(
        "Deleted Successfully. You will redirect to schedule page after 3 seconds"
      );
      setTimeout(() => {
        Router.push("/creator/book-stream");
      }, 3000);
    } catch (error) {
      setLoadingDelete(false);
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  return (
    <Form
      {...layout}
      name="nest-messages"
      onFinish={submit.bind(this)}
      initialValues={
        dataUpcomingStream || {
          title: "",
          description: "",
          isFree: false,
        }
      }
      className="account-form"
    >
      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true, message: "Please enter stream title!" }]}
      >
        <Input min={10} maxLength={100} />
      </Form.Item>
      {/* <Form.Item
        name="description"
        label="Description"
        rules={[
          { required: true, message: "Please enter stream description!" },
        ]}
      >
        <Input.TextArea rows={2} maxLength={200} />
      </Form.Item> */}
      {/* <Form.Item
        name="isFree"
        label="Select an option"
        valuePropName="checked"
      >
        <Switch unCheckedChildren="Pay Per Live for Subscribers" checkedChildren="Free for Subscribers" checked={isFree} onChange={(val) => setFree(val)} />
      </Form.Item> */}
      {/* {!isFree && ( */}
      <Row>
        <Col xs={24} md={12} lg={12}>
          <Form.Item label="Select an option">
            <Radio.Group
              onChange={(e) => setOptionStream(e.target.value)}
              style={{
                display: "flex",
                flexDirection: "column",
              }}
              defaultValue={optionStream}
            >
              <Radio key="subscribe" value="subscribe">
                Pay per live for Subscribers
              </Radio>
              <Radio key="fan" value="fan">
                Pay per live for all Stunnerz Fans
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="price"
            label="Price/Min"
            rules={[{ required: true, message: "Please enter price!" }]}
          >
            <InputNumber min={1} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12} lg={12}>
          <Form.Item>
            <Radio.Group
              onChange={(e) => setOpenTime(e.target.value)}
              style={{
                display: "flex",
                flexDirection: "column",
              }}
              defaultValue={openTime}
            >
              <Radio key="false" value={false}>
                Start streaming now
              </Radio>
              <Radio key="true" value={true}>
                Set up the upcoming stream
              </Radio>
            </Radio.Group>
          </Form.Item>
          {openTime && (
            <Form.Item
              label="Setup Time"
              rules={[{ required: true, message: "Please choose time!" }]}
            >
              <RangePicker
                defaultValue={
                  dataUpcomingStream?._id
                    ? [moment(startDate), moment(endDate)]
                    : null
                }
                onChange={(date) => {
                  setStartDate(moment(date[0]).toISOString());
                  setEndDate(moment(date[1]).toISOString());
                }}
                showTime={{ format: "HH:mm", hideDisabledOptions: true }}
                format="DD/MM/YYYY HH:mm"
                disabledDate={(current) =>
                  current && current < moment().subtract(1, "day")
                }
                disabledTime={(current: any, type: "start" | "end") => {
                  const now = moment();
                  const todayStart = moment().startOf("day");

                  if (moment(current).isSame(todayStart, "day")) {
                    return {
                      disabledHours: () =>
                        Array.from({ length: 24 }, (_, i) => i).filter(
                          (hour) => hour < now.hour()
                        ),
                      disabledMinutes: () => {
                        const currentHour = current.hour();
                        if (currentHour === now.hour()) {
                          return Array.from({ length: 60 }, (_, i) => i).filter(
                            (minute) => minute < now.minute()
                          );
                        }
                        return [];
                      },
                    };
                  }

                  if (type === "end") {
                    if (current && !moment(current).isSame(todayStart, "day")) {
                      return {
                        disabledHours: () => [],
                        disabledMinutes: () => [],
                      };
                    }
                    return {
                      disabledHours: () =>
                        Array.from({ length: 24 }, (_, i) => i).filter(
                          (hour) => hour < moment().hour()
                        ),
                      disabledMinutes: () => {
                        return Array.from({ length: 60 }, (_, i) => i).filter(
                          (minute) => minute < moment().minute()
                        );
                      },
                    };
                  }

                  return {
                    disabledHours: () => [],
                    disabledMinutes: () => [],
                  };
                }}
                allowClear={false}
              />

              <br />
              {dataUpcomingStream?._id && (
                <Popconfirm
                  title="Are you sure to delete this schedule?"
                  onConfirm={handleDelete}
                  okText="Yes"
                  cancelText="No"
                  className="form-popup-delete"
                >
                  <Button
                    className="btn-popup-delete"
                    danger
                    loading={loadingDelete}
                    disabled={loadingDelete}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              )}
            </Form.Item>
          )}
        </Col>
      </Row>
      {/* )} */}
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={submiting || loadingSubmit}
          disabled={submiting || loadingSubmit}
        >
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default StreamPriceForm;
