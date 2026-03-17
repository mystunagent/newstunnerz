import { Layout } from "antd";
import { useEffect } from "react";
import { connect } from "react-redux";
import Head from "next/head";
import { IUIConfig } from "src/interfaces/";
import Messenger from "@components/messages/Messenger";
import { resetMessageState } from "@redux/message/actions";
import Router, { useRouter } from "next/router";

interface IProps {
  ui: IUIConfig;
  resetMessageState: Function;
  currentUser: any;
}

function SextingPage({ ui, currentUser, resetMessageState }: IProps) {
  const params = useRouter();
  const query = params.query;

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
      !currentUser?.infoSubPerformer?.privilege.includes("messages")
    ) {
      Router.push("/");
      return;
    }
  }, [])
  
  useEffect(() => {
    // Cleanup function
    return () => {
      resetMessageState();
    };
  }, [currentUser, resetMessageState]);

  return (
    <>
      <Head>
        <title>{ui && ui.siteName} | Sexting</title>
      </Head>
      <Layout>
        <div className="main-container">
          <Messenger
            toSource={query?.toSource?.toString()}
            toId={query?.toId?.toString()}
          />
        </div>
      </Layout>
    </>
  );
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  currentUser: state.user.current,
});

const mapDispatch = { resetMessageState };
SextingPage.authenticate = true;

export default connect(mapStates, mapDispatch)(SextingPage);
