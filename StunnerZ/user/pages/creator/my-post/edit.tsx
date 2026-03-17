import Head from "next/head";
import { PureComponent } from "react";
import { Layout, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import PageHeading from "@components/common/page-heading";
import { feedService } from "@services/index";
import { connect } from "react-redux";
import { IFeed, IUIConfig } from "@interfaces/index";
import FeedForm from "@components/post/form";
import Router from "next/router";

interface IProps {
  ui: IUIConfig;
  feed: IFeed;
  currentUser: any;
}

class EditPost extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps({ ctx }) {
    try {
      const feed = await (
        await feedService.findById(ctx.query.id, { Authorization: ctx.token })
      ).data;
      return { feed };
    } catch (e) {
      return { ctx };
    }
  }

  componentDidMount() {
    const { feed, currentUser } = this.props;
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
      !currentUser?.infoSubPerformer?.privilege.includes("posting")
    ) {
      message.error(
        "You don’t have privilege  for this Please submit your banking details",
        5
      );
      Router.push("/");
      return;
    }
    if (!feed) {
      Router.back();
    }
  }

  render() {
    const { feed, ui } = this.props;
    return (
      <>
        {feed && (
          <Layout>
            <Head>
              <title>{ui?.siteName} | Edit Post</title>
            </Head>
            <div className="main-container">
              <a aria-hidden onClick={() => Router.back()}>
                <PageHeading icon={<ArrowLeftOutlined />} title=" Edit Post" />
              </a>
              <div>
                <FeedForm feed={feed} />
              </div>
            </div>
          </Layout>
        )}
      </>
    );
  }
}
const mapStates = (state) => ({
  ui: { ...state.ui },
  currentUser: state.user.current,
});
export default connect(mapStates)(EditPost);
