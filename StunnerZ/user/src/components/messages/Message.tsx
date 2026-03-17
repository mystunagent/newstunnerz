import React, { useState } from "react";
import moment from "moment";
import { IUser } from "@interfaces/index";
import { UnlockOutlined, LockOutlined } from "@ant-design/icons";

import { Avatar, Button, Image, message, Modal } from "antd";
import PurchaseMessageContentForm from "@components/post/purchased-message-content";
import Router from "next/router";
import { tokenTransctionService } from "@services/token-transaction.service";
import { updateBalance } from "@redux/user/actions";
import { useDispatch } from "react-redux";

import "./Message.less";
import { VideoPlayer } from "@components/common";

interface IProps {
  data: any;
  isMine: boolean;
  startsSequence: boolean;
  endsSequence: boolean;
  showTimestamp: boolean;
  currentUser: IUser;
  recipient: IUser;
  purcharseMessage: Function;
}

export default function Message(props: IProps) {
  const {
    data,
    isMine,
    startsSequence,
    endsSequence,
    showTimestamp,
    currentUser,
    recipient,
    purcharseMessage,
  } = props;
  const [isHovered, setIsHover] = useState(false);
  const [openPurchaseModal, setOpenPurchaseModal] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [isBought, setIsBought] = useState(data.isPaid);
  const dispatch = useDispatch();

  const friendlyTimestamp = moment(data.createdAt).format("LLLL");

  const purchaseMessageContent = async (payload) => {
    if (!currentUser?._id) {
      message.error("Please log in!");
      Router.push("/auth/login");
      return;
    }
    if (currentUser.balance < payload?.price) {
      message.error("Your wallet balance is not enough");
      Router.push("/wallet");
      return;
    }
    try {
      await setRequesting(true);
      await tokenTransctionService.purchaseMessage(data._id, payload);
      message.success("Unlocked successfully!");
      dispatch(updateBalance({ token: -data.price }));
      purcharseMessage && purcharseMessage();
      setIsBought(true);
    } catch (e) {
      setIsBought(false);
      const error = await e;
      message.error(error.message || "Error occured, please try again later");
    } finally {
      setRequesting(false);
      setOpenPurchaseModal(false);
    }
    setOpenPurchaseModal(false);
    setIsBought(true);
  };
  return (
    <div
      id={data?._id}
      className={[
        "message",
        `${isMine ? "mine" : ""}`,
        `${startsSequence ? "start" : ""}`,
        `${endsSequence ? "end" : ""}`,
      ].join(" ")}
    >
      {/* welcome message content */}
      {data?.type === "welcome-message" && (
        <div className="bubble-container">
          {!isMine && (
            <Avatar
              alt=""
              className="avatar"
              src={recipient?.avatar || "/static/no-avatar.png"}
            />
          )}
          <div className="bubble welcome-message" title={friendlyTimestamp}>
            {data?.meta?.fileType === "photo" && (
              <Image className="" alt="" src={data?.meta?.fileUrl} preview />
            )}
            {data?.meta?.fileType === "video" && (
              <div className="video-content">
                <VideoPlayer
                  {...{
                    key: "video-placeholder",
                    controls: true,
                    muted: true,
                    autoplay: false,
                    loop: true,
                    playsinline: true,
                    sources: [
                      {
                        src: data?.meta?.fileUrl,
                        type: "video/mp4",
                      },
                    ],
                  }}
                />
              </div>
            )}{" "}
            <p>{data?.text}</p>
          </div>
          {isMine && (
            <Avatar
              alt=""
              src={currentUser?.avatar || "/static/no-avatar.png"}
              className="avatar"
            />
          )}
        </div>
      )}

      {/* text message  */}
      {data?.type === "text" && (
        <div className="bubble-container">
          {!isMine && (
            <Avatar
              alt=""
              className="avatar"
              src={recipient?.avatar || "/static/no-avatar.png"}
            />
          )}
          <div className="bubble" title={friendlyTimestamp}>
            {data?.text}
          </div>
          {isMine && (
            <Avatar
              alt=""
              src={currentUser?.avatar || "/static/no-avatar.png"}
              className="avatar"
            />
          )}
        </div>
      )}

      {/* paid message content */}
      {data?.type === "paid-content" && (
        <div className="content-container">
          {!isMine && (
            <Avatar
              alt=""
              className="avatar"
              src={recipient?.avatar || "/static/no-avatar.png"}
            />
          )}
          <div className="content-item" title={friendlyTimestamp}>
            {data?.thumbnailUrls && (
              <div className="lock-content">
                {data?.fileType === "video" && (
                  <>
                    {currentUser?.isPerformer ? (
                      <div className="video-content">
                        <VideoPlayer
                          {...{
                            key: "video-placeholder",
                            controls: true,
                            muted: true,
                            autoplay: false,
                            loop: true,
                            playsinline: true,
                            sources: [
                              {
                                src: data?.fileUrl,
                                type: "video/mp4",
                              },
                            ],
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        {isBought ? (
                          <div className="video-content">
                            <VideoPlayer
                              {...{
                                key: "video-placeholder",
                                controls: true,
                                muted: true,
                                autoplay: false,
                                loop: true,
                                playsinline: true,
                                sources: [
                                  {
                                    src: data?.fileUrl,
                                    type: "video/mp4",
                                  },
                                ],
                              }}
                            />
                          </div>
                        ) : (
                          <Image
                            alt=""
                            src="/static/video_default_thumb.png"
                            preview={false}
                            className="video-thumbUrl-lock"
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                {data?.fileType === "photo" && (
                  <>
                    {currentUser?.isPerformer ? (
                      <Image alt="" src={data?.fileUrl} preview />
                    ) : (
                      <Image
                        alt=""
                        src={isBought ? data?.fileUrl : data?.thumbnailUrls[0]}
                        preview={isBought}
                        className={!isBought && "purchase-image"}
                      />
                    )}
                  </>
                )}
                {!currentUser?.isPerformer && !isBought && (
                  <div className="lock-middle">
                    {isHovered ? <UnlockOutlined /> : <LockOutlined />}
                    <Button
                      onMouseEnter={() => setIsHover(true)}
                      onMouseLeave={() => setIsHover(false)}
                      disabled={currentUser.isPerformer}
                      className="secondary"
                      onClick={() => setOpenPurchaseModal(true)}
                    >
                      Pay ${data?.price} to unlock
                    </Button>
                  </div>
                )}
              </div>
            )}
            {currentUser?.isPerformer ? (
              <>
                <p>{data?.text}</p>
                <p className="price-content">Content Is Paid: ${data?.price}</p>
              </>
            ) : (
              <p className={!isBought && "purchase-text-content"}>
                {data?.text}
              </p>
            )}
          </div>
          {isMine && (
            <Avatar
              alt=""
              src={currentUser?.avatar || "/static/no-avatar.png"}
              className="avatar"
            />
          )}
        </div>
      )}
      {/* free message content */}
      {data?.type === "free-content" && (
        <div className="content-container">
          {!isMine && (
            <Avatar
              alt=""
              className="avatar"
              src={recipient?.avatar || "/static/no-avatar.png"}
            />
          )}
          <div className="content-item" title={friendlyTimestamp}>
            {data?.fileType === "video" && (
              <div className="video-content">
                <VideoPlayer
                  {...{
                    key: "video-placeholder",
                    controls: true,
                    muted: true,
                    autoplay: false,
                    loop: true,
                    playsinline: true,
                    sources: [
                      {
                        src: data?.fileUrl,
                        type: "video/mp4",
                      },
                    ],
                  }}
                />
              </div>
            )}
            {data?.fileType === "photo" && (
              <Image alt="" src={data?.fileUrl} preview />
            )}
            {data?.text}
          </div>
          {isMine && (
            <Avatar
              alt=""
              src={currentUser?.avatar || "/static/no-avatar.png"}
              className="avatar"
            />
          )}
        </div>
      )}
      {/* free message content */}
      {(data?.type === "photo" || data?.type === "video") && (
        <div className="content-container">
          {!isMine && (
            <Avatar
              alt=""
              className="avatar"
              src={recipient?.avatar || "/static/no-avatar.png"}
            />
          )}
          <div className="content-item" title={friendlyTimestamp}>
            {data?.type === "video" && (
              <div className="video-content">
                <VideoPlayer
                  {...{
                    key: "video-placeholder",
                    controls: true,
                    muted: true,
                    autoplay: false,
                    loop: true,
                    playsinline: true,
                    sources: [
                      {
                        src: data?.fileUrl,
                        type: "video/mp4",
                      },
                    ],
                  }}
                />
              </div>
            )}
            {data?.type === "photo" && (
              <Image alt="" src={data?.imageUrl} preview />
            )}
            {data?.text}
          </div>
          {isMine && (
            <Avatar
              alt=""
              src={currentUser?.avatar || "/static/no-avatar.png"}
              className="avatar"
            />
          )}
        </div>
      )}

      {/* mass message */}
      {data?.type === "mass-message" && (
        <div className="content-container">
          {!isMine && (
            <Avatar
              alt=""
              className="avatar"
              src={recipient?.avatar || "/static/no-avatar.png"}
            />
          )}
          <div className="content-item" title={friendlyTimestamp}>
            {data.fileUrl && (
              <>
                {data?.fileType === "video" && (
                  <div className="video-content">
                    <VideoPlayer
                      {...{
                        key: "video-placeholder",
                        controls: true,
                        muted: true,
                        autoplay: false,
                        loop: true,
                        playsinline: true,
                        sources: [
                          {
                            src: data?.fileUrl,
                            type: "video/mp4",
                          },
                        ],
                      }}
                    />
                  </div>
                )}
                {data?.fileType === "photo" && (
                  <Image
                    alt=""
                    src={
                      data?.fileUrl !== null ? data?.fileUrl : data?.imageUrl
                    }
                    preview
                  />
                )}
              </>
            )}
            {data?.text}
          </div>
          {isMine && (
            <Avatar
              alt=""
              src={currentUser?.avatar || "/static/no-avatar.png"}
              className="avatar"
            />
          )}
        </div>
      )}
      {showTimestamp && <div className="timestamp">{friendlyTimestamp}</div>}
      <Modal
        key="purchase_post"
        className="purchase-modal"
        title={null}
        visible={openPurchaseModal}
        footer={null}
        width={600}
        destroyOnClose
        onCancel={() => setOpenPurchaseModal(false)}
      >
        <PurchaseMessageContentForm
          message={data}
          performer={recipient}
          submiting={requesting}
          onFinish={purchaseMessageContent.bind(this)}
        />
      </Modal>
    </div>
  );
}
