/* eslint-disable react/no-danger */
import { PureComponent } from 'react';
import { Row, Col, Layout } from 'antd';
import Link from 'next/link';
import Head from 'next/head';
import { ISettings, IUIConfig } from 'src/interfaces';
import { connect } from 'react-redux';
import { authService, userService } from '@services/index';
import { loginSuccess } from '@redux/auth/actions';
import { updateCurrentUser } from '@redux/user/actions';
import Router from 'next/router';
import './index.less';

interface IProps {
  ui: IUIConfig;
  loginSuccess: Function;
  updateCurrentUser: Function;
  settings: ISettings;
  rel: string;
}
class Dashboard extends PureComponent<IProps> {
  static layout = 'blank';

  static authenticate = false;

  static async getInitialProps({ ctx }) {
    return {
      rel: ctx?.query?.rel
    };
  }

  state = {
    loginAs: 'performer'
  };

  async componentDidMount() {
    const {
      loginSuccess: loginSuccessHandler,
      updateCurrentUser: updateCurrentUserHandler
    } = this.props;
    const token = authService.getToken();
    if (!token || token === 'null') {
      return;
    }
    authService.setToken(token);
    const user = await userService.me({ Authorization: token });

    if (!user.data._id) {
      return;
    }
    loginSuccessHandler();
    updateCurrentUserHandler(user.data);
    Router.push('/');
  }

  handleSwitch(value) {
    this.setState({ loginAs: value });
  }

  render() {
    const { loginAs } = this.state;
    const { ui, rel } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            | Register
          </title>
        </Head>
        <div className="main-container">
          <div className="login-box">
            <Row>
              <Col sm={24} md={8} lg={12}>
                <div className="login-content left fixed" style={ui.loginPlaceholderImage ? { backgroundImage: `url(${ui.loginPlaceholderImage})` } : null} />
              </Col>
              <Col sm={24} md={16} lg={12}>
                <div className="login-content right custom">
                  <div className="switch-btn">
                    <button
                      type="button"
                      className={loginAs === 'performer' ? 'active' : ''}
                      onClick={this.handleSwitch.bind(this, 'performer')}
                    >
                      Creator Signup
                    </button>
                    <button
                      type="button"
                      className={loginAs === 'user' ? 'active' : ''}
                      onClick={this.handleSwitch.bind(this, 'user')}
                      style={{ marginRight: '20px' }}
                    >
                      Join as Guest
                    </button>
                  </div>

                  <div className="welcome-box">
                    <h3>
                      {loginAs === 'user' ? 'Fan' : 'Creator'}
                      {' '}
                      Benefits
                    </h3>
                    {loginAs === 'performer' ? (
                      <div>
                        {ui && ui.modelBenefit
                          ? <div dangerouslySetInnerHTML={{ __html: ui.modelBenefit }} />
                          : (
                            <ul>
                              <li>Lightning fast uploading</li>
                              <li>Multi-video uploading</li>
                              <li>Chat with fans</li>
                              <li>Cross-over-content between models</li>
                              <li>Individual model store</li>
                              <li>
                                Affiliate program for blogs to promote your
                                content
                              </li>
                              <li>80% Standard commission rate</li>
                              <li>(Deduct 5% when gained from affiliates)</li>
                            </ul>
                          )}
                        <Link href={rel ? { pathname: '/auth/creator-register', query: { rel } } : '/auth/creator-register'}>
                          <a className="btn-primary ant-btn ant-btn-primary ant-btn-lg">
                            CREATOR SIGN UP
                          </a>
                        </Link>
                      </div>
                    ) : (
                      <div>
                        {ui && ui.userBenefit ? <div dangerouslySetInnerHTML={{ __html: ui.userBenefit }} /> : (
                          <ul>
                            <li>View exclusive content</li>
                            <li>Monthly and Six Months subscriptions</li>
                            <li>Fast and reliable buffering and viewing</li>
                            <li>Multiple solution options to choose from</li>
                            <li>Chat with model</li>
                            <li>Access model&apos;s personal store</li>
                            <li>Search and filter capabilities</li>
                            <li>Favorite your video for future viewing</li>
                          </ul>
                        )}
                        <Link href={rel ? { pathname: '/auth/fan-register', query: { rel } } : '/auth/fan-register'}>
                          <a className="btn-primary ant-btn ant-btn-primary ant-btn-lg">
                            Join as Guest
                          </a>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Layout>
    );
  }
}

const mapStatesToProps = (state: any) => ({
  ui: { ...state.ui },
  settings: { ...state.settings },
  registerPerformerData: { ...state.auth.registerPerformerData }
});

const mapDispatch = {
  loginSuccess, updateCurrentUser
};

export default connect(mapStatesToProps, mapDispatch)(Dashboard);
