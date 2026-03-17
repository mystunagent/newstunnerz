import { PureComponent } from "react";
import Head from "next/head";
import Link from "next/link";
import { connect } from "react-redux";
import { Layout } from "antd";
import "./index.less";
import { IUser } from "@interfaces/user";
import { logout } from "@redux/auth/actions";
import { SocketContext } from "src/socket";

interface IProps {
  ui: any;
  user: IUser;
  logout: Function;
}

class EmailVerifiedSuccess extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  render() {
    const { ui } = this.props;
    const { siteName } = ui;
    return (
      <>
        <Head>
          <title>{siteName} | Email Verification </title>
        </Head>
        <Layout>
          <div className="email-verify-succsess">
            <p>
              Your email has been verified,
              <Link href="/auth/login">
                <a> click here to login</a>
              </Link>
            </p>
          </div>
        </Layout>
      </>
    );
  }
}
EmailVerifiedSuccess.contextType = SocketContext;
const mapStatetoProps = (state: any) => ({
  ui: { ...state.ui },
  user: { ...state.user.current },
});

export default connect(mapStatetoProps, { logout })(EmailVerifiedSuccess);
