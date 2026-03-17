import { Button, DatePicker, Layout, message, Select } from "antd";
import moment from "moment";
import { useState } from "react";

type IProps = {
  // eslint-disable-next-line react/require-default-props
  onSubmit: Function;
  loading: boolean;
};
const { RangePicker } = DatePicker;

export default function CreateFormTimeStream({ loading, onSubmit }: IProps) {
  const [startAt, setStartAt] = useState<any>("");
  const [endAt, setEndAt] = useState<any>("");
  const [status, setStatus] = useState("active");

  const handleUpload = async () => {
    if (!startAt || !endAt) {
      message.error("Please select date");
      return;
    }

    try {
      await onSubmit({
        status,
        startAt: moment(startAt).toISOString(),
        endAt: moment(endAt).toISOString(),
      });
      setStartAt("");
      setEndAt("");
    } catch (error) {
      const e = await error;
      message.error(e.message || "An error occurred while loading");
    }
  };

  return (
    <Layout>
      <RangePicker
        style={{ width: "100%" }}
        onChange={(dates: [any, any]) => {
          setStartAt(dates[0]);
          setEndAt(dates[1]);
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
      <Select
        style={{ width: "100%" }}
        defaultValue="active"
        onSelect={(e) => setStatus(e.toString())}
        placeholder="Select status"
      >
        <Select.Option value="active">Active</Select.Option>
        <Select.Option value="inactive">Inactive</Select.Option>
      </Select>
      <br />
      <Button
        onClick={handleUpload}
        loading={loading}
        disabled={loading}
        type="primary"
      >
        Submit
      </Button>
    </Layout>
  );
}
