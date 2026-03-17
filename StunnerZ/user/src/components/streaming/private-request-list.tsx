import { streamService } from "@services/stream.service";
import { Button, Col, message, Row } from "antd";
import moment from "moment";
import Router from "next/router";
import { useEffect, useRef, useState } from "react";
import "./private-request-list.less";
import { userService } from "@services/user.service";

function PrivateRequestList() {
  const _timeout = useRef(null);
  const [list, setList] = useState([]);

  const loadList = async () => {
    if (_timeout.current) clearTimeout(_timeout.current);

    const res = await streamService.getPrivateList();
    setList(res.data);
    const el = document.querySelector("#privateRequestTotal");
    if (el) el.innerHTML = `(${res?.data?.length || 0})`;

    _timeout.current = setTimeout(() => {
      loadList();
    }, 5000);
  };

  const acceptRequest = async (request) => {
    try {
      const user = await userService.findById(request?.requester?._id) as any;
      if (user && user.isOnline === 0) {
        message.info(`${user?.name || user?.username} is offline`);
        return;
      } else if (user && user.isOnline === 1) {
        Router.push(
          {
            pathname: "/creator/live/private",
            query: { key: request.conversationId },
          },
          `/creator/live/private/${request.conversationId}`
        );
        await streamService.modelSendNotifyAcceptPrivateChat({
          conversationId: request.conversationId,
        });
      }
    } catch (error) {
      // 
    }
  };

  const deletePrivateRequest = async (id) => {
    await streamService.rejectPrivateChat(id);
  };

  useEffect(() => {
    loadList();

    return () => {
      if (_timeout.current) clearTimeout(_timeout.current);
    };
  }, []);

  if (!list.length)
    return (
      <p style={{ padding: "15px", textAlign: "center" }}>
        No private request available!
      </p>
    );

  return (
    <ul className="private-request-list-items">
      {list.map((item) => (
        <li>
          {item.requester?.name || item.requester?.username} -{" "}
          {moment(item.createdAt).fromNow()}
          <br />
          <div style={{ display: 'flex', alignItems: 'center'}}>
            <Button
              style={{ marginRight: '2px' }}
              className="secondary"
              onClick={() => acceptRequest(item)}
            >
              Accept
            </Button>
            <Button
              danger
              onClick={() => deletePrivateRequest(item?.conversationId)}
            >
              Reject
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default PrivateRequestList;
