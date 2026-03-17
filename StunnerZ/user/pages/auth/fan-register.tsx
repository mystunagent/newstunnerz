/* eslint-disable camelcase */
import { Row, Col, Button, Layout, Form, Input, message, Checkbox } from "antd";
import { PureComponent } from "react";
import Link from "next/link";
import { registerFan, loginSocial } from "@redux/auth/actions";
import { connect } from "react-redux";
import Head from "next/head";
import { ISettings, IUIConfig } from "src/interfaces";
import { authService } from "@services/auth.service";
import "./index.less";
import { isVideo } from "@lib/string";
import { VideoPlayer } from "@components/common";
import { omit } from "lodash";
import Header from "@components/common/layout/header";
import Router from "next/router";

interface IProps {
  ui: IUIConfig;
  settings: ISettings;
  registerFan: Function;
  registerFanData: any;
  loginSocial: Function;
  rel: string;
}

class FanRegister extends PureComponent<IProps> {
  static authenticate = false;

  static layout = "blank";

  static async getInitialProps({ ctx }) {
    return {
      rel: ctx?.query?.rel,
    };
  }

  state = {
    isLoading: false,
  };

  handleRegister = (data: any) => {
    const { registerFan: handleRegister, rel } = this.props;
    const { tos_confirm, tfc_confirm, tosf_confirm } = data;
    if (!tos_confirm || !tfc_confirm || !tosf_confirm) {
      return message.error(
        "Please check the terms and ticking to the boxes below"
      );
    }

    handleRegister({
      ...omit(data, ["tos_confirm", "tfc_confirm", "tosf_confirm"]),
      rel,
    });
    return true;
  };

  async onGoogleLogin(resp: any) {
    if (!resp?.credential) {
      return;
    }
    const { loginSocial: handleLogin } = this.props;
    const payload = { tokenId: resp.credential, role: "user" };
    try {
      await this.setState({ isLoading: true });
      const response = await (await authService.loginGoogle(payload)).data;
      response.token && handleLogin({ token: response.token });
    } catch (e) {
      const error = await e;
      message.error(
        error && error.message
          ? error.message
          : "Google login authenticated fail"
      );
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async loginTwitter() {
    try {
      await this.setState({ isLoading: true });
      const resp = await (await authService.loginTwitter()).data;
      if (resp && resp.url) {
        authService.setTwitterToken(
          {
            oauthToken: resp.oauthToken,
            oauthTokenSecret: resp.oauthTokenSecret,
          },
          "user"
        );
        window.location.href = resp.url;
      }
    } catch (e) {
      const error = await e;
      message.error(
        error?.message || "Something went wrong, please try again later"
      );
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const { ui, registerFanData, rel } = this.props;
    const { requesting: submiting } = registerFanData;
    const { isLoading } = this.state;
    return (
      <Layout>
        <Head>
          <title>{ui && ui.siteName} | Sign up</title>
        </Head>
        <Header />
        <div className="main-container">
          <div className="login-box">
            <p className="text-center">
              <small>
                Do not create an account on this page if you are a creator.
                Creators must create an account on{" "}
                <a
                  onClick={() =>
                    rel
                      ? Router.push({
                          pathname: "/auth/creator-register",
                          query: { rel },
                        })
                      : Router.push("/auth/creator-register")
                  }
                >
                  this link
                </a>
              </small>
            </p>
            <Row>
              <Col xs={24} sm={24} md={6} lg={12}>
                {!isVideo(ui.loginPlaceholderImage) && (
                  <div
                    className="login-content left"
                    style={
                      ui.loginPlaceholderImage
                        ? {
                            backgroundImage: `url(${ui.loginPlaceholderImage})`,
                          }
                        : null
                    }
                  />
                )}
                {isVideo(ui.loginPlaceholderImage) && (
                  <VideoPlayer
                    {...{
                      key: "video-placeholder",
                      controls: true,
                      muted: true,
                      autoplay: true,
                      loop: true,
                      playsinline: true,
                      sources: [
                        {
                          src: ui.loginPlaceholderImage,
                          type: "video/mp4",
                        },
                      ],
                    }}
                  />
                )}
              </Col>
              <Col xs={24} sm={24} md={18} lg={12}>
                <div className="login-content right">
                  <div className="title">Join as Guest</div>
                  <p className="text-center">
                    <small>Sign up to interact with your idols!</small>
                  </p>
                  {/* <div className="social-login">
                    <button
                      type="button"
                      disabled={!settings.twitterClientId}
                      onClick={() => this.loginTwitter()}
                      className="twitter-button"
                    >
                      <TwitterOutlined />
                      {' '}
                      SIGN UP WITH TWITTER
                    </button>
                    <GoogleLoginButton
                      clientId={settings.googleClientId}
                      onSuccess={this.onGoogleLogin.bind(this)}
                      onFailure={this.onGoogleLogin.bind(this)}
                    />
                  </div>
                  <Divider>Or</Divider> */}
                  <div className="login-form">
                    <Form
                      labelCol={{ span: 24 }}
                      name="member_register"
                      initialValues={{
                        tos_confirm: false,
                        tfc_confirm: false,
                        tosf_confirm: false,
                      }}
                      onFinish={this.handleRegister.bind(this)}
                      scrollToFirstError
                    >
                      <Form.Item
                        name="email"
                        validateTrigger={["onChange", "onBlur"]}
                        rules={[
                          {
                            required: true,
                            message: "Please input your email!",
                          },
                          {
                            type: "email",
                            message: "Email is wrong format!",
                          },
                        ]}
                        hasFeedback
                      >
                        <Input placeholder="Email address" />
                      </Form.Item>
                      <Form.Item
                        name="username"
                        validateTrigger={["onChange", "onBlur"]}
                        rules={[
                          {
                            required: true,
                            message: "Please input your username!",
                          },
                          {
                            pattern: new RegExp(/^[a-z0-9]+$/g),
                            message:
                              "Username must contain lowercase alphanumerics only",
                          },
                          {
                            min: 3,
                            message:
                              "Username must containt at least 3 characters",
                          },
                        ]}
                        hasFeedback
                      >
                        <Input placeholder="Username" />
                      </Form.Item>
                      <Form.Item
                        name="name"
                        validateTrigger={["onChange", "onBlur"]}
                        rules={[
                          {
                            required: true,
                            message: "Please input your display name!",
                          },
                          {
                            pattern: new RegExp(/^(?=.*\S).+$/g),
                            message:
                              "Display name can not contain only whitespace",
                          },
                        ]}
                      >
                        <Input placeholder="Display name" />
                      </Form.Item>
                      <Form.Item
                        name="password"
                        validateTrigger={["onChange", "onBlur"]}
                        rules={[
                          {
                            pattern: new RegExp(
                              /^(?=.{8,})(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])(?=.*[^\w\d]).*$/g
                            ),
                            message:
                              "Password must have minimum 8 characters, at least 1 number, 1 uppercase letter, 1 lowercase letter & 1 special character",
                          },
                          {
                            required: true,
                            message: "Please enter your password!",
                          },
                        ]}
                      >
                        <Input.Password placeholder="Password" />
                      </Form.Item>
                      <Form.Item style={{ textAlign: "center" }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          className="login-form-button"
                          disabled={submiting || isLoading}
                          loading={submiting || isLoading}
                        >
                          SIGN UP
                        </Button>
                      </Form.Item>

                      <div className="tos-confirm-container">
                        <p>
                          By ticking the boxes below you confirm that you have
                          read and agree to the terms
                        </p>
                        <Form.Item name="tos_confirm" valuePropName="checked">
                          <Checkbox>
                            <a href="/page/terms-of-service" target="_blank">
                              General Terms of Service
                            </a>
                          </Checkbox>
                        </Form.Item>
                        <Form.Item name="tfc_confirm" valuePropName="checked">
                          <Checkbox>
                            <a
                              href="/page/terms-followers-creators"
                              target="_blank"
                            >
                              Terms between Followers and Creator
                            </a>
                          </Checkbox>
                        </Form.Item>
                        <Form.Item name="tosf_confirm" valuePropName="checked">
                          <Checkbox>
                            <a
                              href="/page/terms-of-services-for-followers"
                              target="_blank"
                            >
                              Terms of Service for Followers
                            </a>
                          </Checkbox>
                        </Form.Item>
                      </div>
                      <p className="text-center">
                        Have an account already?
                        <Link href={rel ? `/auth/login?rel=${rel}` : '/auth/login'}>
                          <a> Login.</a>
                        </Link>
                      </p>
                      <p className="text-center">
                        Are you a creator?
                        <Link href={rel ? `/auth/creator-register?rel=${rel}` : '/auth/creator-register'}>
                          <a> Sign up here.</a>
                        </Link>
                      </p>
                    </Form>
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
  ui: state.ui,
  settings: state.settings,
  registerFanData: state.auth.registerFanData,
});

const mapDispatchToProps = { registerFan, loginSocial };

export default connect(mapStatesToProps, mapDispatchToProps)(FanRegister);
