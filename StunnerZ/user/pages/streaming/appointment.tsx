import dynamic from "next/dynamic";
import { IConversation, IPerformer } from "src/interfaces";
import { performerService, streamService } from "src/services";
import nextCookie from "next-cookies";
import Head from "next/head";
import { connect } from "react-redux";
import { message } from "antd";
import { useEffect, useState } from "react";
import { redirectTo } from "@lib/utils";

const UserPrivateStreamWrapper = dynamic(
  () => import("@components/streaming/user-private-booking-chat"),
  { ssr: false }
);

interface IProps {
  performer: IPerformer;
  activeStream: any;
  conversation: IConversation;
  user: any;
  ui: any;
  updateBalance: any;
  activeConversation: any;
  upcoming: any;
}

UserBookPrivateStream.getInitialProps = async ({ ctx }) => {
  const { query } = ctx;
  const { token } = nextCookie(ctx);

  const headers = { Authorization: token };
  if (!query?.username && !query.conversationId) return { notFound: true };
  try {
    const performerResponse = await performerService.findOne(
      query.username.toString(),
      headers
    );
    const streamResponse = await streamService.getBookPrivateChat(
      query.conversationId
    );

    if (
      !streamResponse?.data?.activeStream &&
      !streamResponse?.data?.conversation
    ) {
      if (typeof window !== "undefined") message.info("Stream not exists", 5);
      return redirectTo("/");
    }

    return {
      activeStream: streamResponse.data?.activeStream,
      conversation: streamResponse.data?.conversation,
      performer: performerResponse.data,
      upcoming: streamResponse.data?.upcoming,
    };
  } catch (error) {
    const e = await error;
    if (typeof window !== "undefined")
      message.error(e.message || "An error occurred");
    return redirectTo("/");
  }
};

function UserBookPrivateStream({
  performer,
  activeStream,
  conversation,
  ui,
  activeConversation,
  user,
  upcoming,
}: IProps) {
  const [oneShow, setOneShow] = useState(true);
  useEffect(() => {
    if (activeStream && user) {
      if (user.balance < activeStream?.price) {
        message.info("You have not enough token", 5);
        setTimeout(() => {
          window.location.href = "/wallet";
        }, 5000);
        return;
      }
    }
  }, [activeStream, user]);

  useEffect(() => {
    if (upcoming) {
      const interval = setInterval(() => {
        const now = new Date();
        const endTime = new Date(upcoming.endAt);
        const oneMinuteBefore = new Date(endTime.getTime() - 60 * 1000);

        if (now >= endTime) {
          clearInterval(interval);
          window.location.href = `${performer?.username}`;
        } else if (now >= oneMinuteBefore) {
          if (oneShow === true) {
            message.info("The stream will end after 1 minutes", 10);
            setOneShow(false);
          }
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <>
      <Head>
        <title>
          {`${ui?.siteName || ""} | 1-1 Chat ${performer?.username}`}
        </title>
      </Head>
      {performer && activeStream && conversation && (
        <div className="main-container">
          <UserPrivateStreamWrapper
            activeStream={activeStream}
            conversation={conversation}
            performer={performer}
            activeConversation={activeConversation}
          />
        </div>
      )}
    </>
  );
}

UserBookPrivateStream.authenticate = true;

const mapStateToProps = (state) => ({
  ui: { ...state.ui },
  user: { ...state.user.current },
  activeConversation: { ...state.streamMessage.activeConversation },
});

export default connect(mapStateToProps)(UserBookPrivateStream);
