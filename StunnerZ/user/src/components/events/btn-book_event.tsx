import { eventService } from "@services/events.service";
import { Button, message } from "antd";
import Router from "next/router";
import { useState } from "react";

type IProps = {
  id: string;
  data: any;
  performer: any;
};

export default function BtnBookEvent({ id, data, performer }: IProps) {
  const [uploading, setUploading] = useState(false);

  const bookEvent = async () => {
    try {
      setUploading(true);
      await eventService.bookEvent({ id });
      setUploading(false);
      message.success("Booked successfully");
      Router.reload();
    } catch (error) {
      setUploading(false);
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  let status;

  switch (true) {
    case data?.booked?.evt?.status === "approved":
      status = "Approved";
      break;
    case data?.booked?.evt?.status === "rejected":
      status = "Rejected";
      break;
    case data?.booked?.evt?.status === "pending" &&
      data?.booked?.evt?.performerId.toString() === performer?._id.toString():
      status = "Requested";
      break;
    default:
      status = "Request";
      break;
  }

  return (
    <Button
      key={id}
      loading={uploading}
      disabled={
        data?.booked?.evt?.performerId.toString() ===
          performer?._id.toString() || uploading
      }
      onClick={bookEvent}
    >
      {status}
    </Button>
  );
}
