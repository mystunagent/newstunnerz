import Head from "next/head";
import { connect } from "react-redux";
import { Layout } from "antd";
import { IPerformer, IUIConfig } from "src/interfaces";
import WelcomeMessageForm from "@components/performer/welcome-mssage-form";
import { useEffect } from "react";
import Router from "next/router";

interface IProps {
  currentUser: IPerformer;
  ui: IUIConfig;
}
function WelcomMessagePage({ currentUser, ui }: IProps) {
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
      !currentUser?.infoSubPerformer?.privilege.includes("welcome_message")
    ) {
      Router.push("/");
      return;
    }
  }, []);

  return (
    <Layout>
      <Head>
        <title>{ui && ui.siteName} | Welcome Message</title>
      </Head>
      <div className="main-container user-account">
        <WelcomeMessageForm performer={currentUser} />
      </div>
    </Layout>
  );
}

const mapStates = (state: any) => ({
  currentUser: state.user.current,
  ui: state.ui,
});

WelcomMessagePage.authenticate = true;

WelcomMessagePage.onlyPerformer = true;

export default connect(mapStates, null)(WelcomMessagePage);
