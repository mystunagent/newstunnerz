import dynamic from "next/dynamic";
import { IConversation, IPerformer } from "src/interfaces";
import { performerService, streamService } from "src/services";
import nextCookie from "next-cookies";
import Head from "next/head";
import { connect } from "react-redux";
import { message } from "antd";
import Router from "next/router";
import { redirectTo } from "@lib/utils";

const UserPrivateStreamWrapper = dynamic(
  () => import("@components/streaming/user-private-chat"),
  { ssr: false }
);

interface IProps {
  performer: IPerformer;
  activeStream: any;
  conversation: IConversation;
  ui: any;
  updateBalance: any;
  activeConversation: any;
}

UserPrivateStream.getInitialProps = async ({ ctx }) => {
  const { query } = ctx;
  const { token } = nextCookie(ctx);

  const headers = { Authorization: token };
  if (!query?.username) return { notFound: true };
  try {
    const performerResponse = await performerService.findOne(
      query.username.toString(),
      headers
    );
    const streamResponse = await streamService.requestPrivateChat(
      performerResponse.data?._id
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
    };
  } catch (error) {
    const e = await error;
    if (typeof window !== "undefined")
      message.error(e.message || "An error occurred");
    return redirectTo("/");
  }
};

function UserPrivateStream({
  performer,
  activeStream,
  conversation,
  ui,
  activeConversation,
}: IProps) {
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

UserPrivateStream.authenticate = true;

const mapStateToProps = (state) => ({
  ui: { ...state.ui },
  activeConversation: { ...state.streamMessage.activeConversation },
});

export default connect(mapStateToProps)(UserPrivateStream);
