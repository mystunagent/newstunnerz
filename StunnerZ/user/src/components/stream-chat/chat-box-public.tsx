import { useState, useEffect } from "react";
import { Button, Col, message, Modal, Row } from "antd";
import Tabs from "src/components/common/base/tabs";
import StreamMessenger from "@components/stream-chat/Messenger";
import { getResponseError } from "@lib/utils";
import { messageService, tokenTransctionService } from "src/services";
import PrivateRequestList from "@components/streaming/private-request-list";
import Router from "next/router";
import { TipPerformerForm } from "@components/performer";
import { updateBalance } from "@redux/user/actions";
import "./chat-box-public.less";

interface IProps {
  resetAllStreamMessage?: Function;
  user?: any;
  performer?: any;
  activeConversation?: any;
  showPrivateRequests?: boolean;
  activeStream?: any;
}

const checkPermission = (user, conversation) => {
  if (
    (user?._id === conversation?.data?.performerId && user?.isPerformer) ||
    user?.roles?.includes("admin")
  ) {
    return true;
  }
  return false;
};

const ChatBoxPublicStream = ({
  resetAllStreamMessage,
  user,
  activeConversation,
  showPrivateRequests,
  performer,
  activeStream
}: IProps) => {
  const [removing, setRemoving] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const [openTipModal, setOpenTipModal] = useState(false);

  useEffect(() => {
    setCanReset(checkPermission(user, activeConversation));
  }, [user, activeConversation]);

  const removeAllMessage = async () => {
    if (!canReset) {
      message.error("You don't have permission!");
      return;
    }

    try {
      setRemoving(true);
      if (!window.confirm("Are you sure you want to clear all chat history?")) {
        return;
      }
      await messageService.deleteAllMessageInConversation(
        activeConversation.data._id
      );
      resetAllStreamMessage &&
        resetAllStreamMessage({ conversationId: activeConversation.data._id });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      setRemoving(false);
    }
  };

  const sendTip = async (token?: any) => {
    if (user.balance < token) {
      message.error('You have an insufficient wallet balance. Please top up.');
      Router.push('/wallet');
      return;
    }
    try {
      setSubmiting(true);
      await tokenTransctionService.sendTip(performer?._id, {
        price: token,
        conversationId: activeStream?._id,
        sessionId: activeStream?.sessionId,
        streamType: 'stream_public'
      });
      message.success('Thank you for the tip!');
      updateBalance({ token: -token });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'Error occurred, please try again later');
    } finally {
      setSubmiting(false);
    }
  }

  return (
    <>
      <div className="conversation-stream">
        <Tabs defaultActiveKey="chat_content">
          <Tabs.TabPane tab="CHAT" key="chat_content">
            {activeConversation &&
            activeConversation.data &&
            activeConversation.data.streamId ? (
              <StreamMessenger streamId={activeConversation.data.streamId} />
            ) : (
              <p className="text-center">Let start a conversation</p>
            )}
          </Tabs.TabPane>
          {showPrivateRequests && (
            <Tabs.TabPane
              forceRender
              tab={
                <>
                  Private requests <span id="privateRequestTotal" />
                </>
              }
              key="private_requests"
            >
              <PrivateRequestList />
            </Tabs.TabPane>
          )}
        </Tabs>
      </div>
      {canReset && (
        <div style={{ margin: "10px" }}>
          <Button
            type="primary"
            loading={removing}
            onClick={() => removeAllMessage()}
          >
            Clear chat history
          </Button>
        </div>
      )}
      <Modal
        key="tip"
        centered
        title={null}
        visible={openTipModal}
        onOk={() => setOpenTipModal(false)}
        footer={null}
        onCancel={() => setOpenTipModal(false)}
        width={600}
      >
        <TipPerformerForm
          performer={performer}
          submiting={submiting}
          onFinish={sendTip.bind(this)}
        />
      </Modal>
    </>
  );
};

ChatBoxPublicStream.defaultProps = {
  activeConversation: null,
  user: null,
  resetAllStreamMessage: null,
};

export default ChatBoxPublicStream;
