import { useState, useEffect } from "react";
import { Button, Col, message, Modal, Row } from "antd";
import Tabs from "src/components/common/base/tabs";
import StreamMessenger from "@components/stream-chat/Messenger";
import { getResponseError } from "@lib/utils";
import { messageService, tokenTransctionService } from "src/services";
import "./chat-box.less";
import PrivateRequestList from "@components/streaming/private-request-list";
import Router from "next/router";
import { TipPerformerForm } from "@components/performer";
import { updateBalance } from "@redux/user/actions";

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
    user?._id === conversation?.data?.performerId ||
    user?.roles?.includes("admin")
  ) {
    return true;
  }
  return false;
};

const ChatBox = ({
  resetAllStreamMessage,
  user,
  activeConversation,
  showPrivateRequests,
  performer,
  activeStream,
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
      message.error("You have an insufficient wallet balance. Please top up.");
      Router.push("/wallet");
      return;
    }
    try {
      setSubmiting(true);
      await tokenTransctionService.sendTip(performer?._id, {
        price: token,
        conversationId: activeConversation.data?._id,
        sessionId: activeStream?.sessionId,
        streamType: "stream_public",
      });
      message.success("Thank you for the tip!");
      updateBalance({ token: -token });
    } catch (e) {
      const err = await e;
      message.error(err.message || "Error occured, please try again later");
    } finally {
      setSubmiting(false);
    }
  };

  return (
    <>
      <div className="conversation-stream">
        <div className="conversation-stream-content">
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
            <Tabs.TabPane
              tab={
                <>
                  {activeStream?.description === "upcoming" ? (
                    <Row className="conversation-stream-btn-options">
                      <Col lg={24} xs={24}>
                        <Row>
                          <Col xs={12}>
                            <Button
                              block
                              className="secondary secondary2"
                              onClick={(e) => {
                                e.stopPropagation();
                                Router.push(
                                  {
                                    pathname: "/creator/profile",
                                    query: {
                                      username:
                                        performer?.username || performer?._id,
                                    },
                                  },
                                  `/${performer?.username || performer?._id}`
                                );
                              }}
                            >
                              Leave Chat
                            </Button>
                          </Col>
                          <Col xs={12}>
                            <Button
                              block
                              className="secondary secondary2"
                              disabled={submiting}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenTipModal(true);
                              }}
                            >
                              Send Tip
                            </Button>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  ) : (
                    <Row className="conversation-stream-btn-options">
                      <Col lg={24} xs={24}>
                        <Row>
                          <Col xs={8}>
                            <Button
                              block
                              className="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                Router.push(
                                  {
                                    pathname: "/private-streaming/privatechat",
                                    query: {
                                      username:
                                        performer?.username || performer?._id,
                                    },
                                  },
                                  `/private-streaming/privatechat/${
                                    performer?.username || performer?._id
                                  }`
                                );
                              }}
                            >
                              Private Call
                            </Button>
                          </Col>
                          <Col xs={8}>
                            <Button
                              block
                              className="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                Router.push(
                                  {
                                    pathname: "/creator/profile",
                                    query: {
                                      username:
                                        performer?.username || performer?._id,
                                    },
                                  },
                                  `/${performer?.username || performer?._id}`
                                );
                              }}
                            >
                              Leave Chat
                            </Button>
                          </Col>
                          <Col xs={8}>
                            <Button
                              block
                              className="secondary"
                              disabled={submiting}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenTipModal(true);
                              }}
                            >
                              Send Tip
                            </Button>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  )}
                </>
              }
            />
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

ChatBox.defaultProps = {
  activeConversation: null,
  user: null,
  resetAllStreamMessage: null,
};

export default ChatBox;
