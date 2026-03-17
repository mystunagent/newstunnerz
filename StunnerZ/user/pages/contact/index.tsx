/* eslint-disable react/no-did-update-set-state */
import { Layout, Col, Row } from 'antd';
import Head from 'next/head';
import { connect } from 'react-redux';
import { IUIConfig } from 'src/interfaces';
import '../auth/index.less';

interface IProps {
  ui: IUIConfig;
}

const ContactPage = ({ ui }: IProps) => (
  <Layout>
    <script type="text/javascript" src="https://s3.amazonaws.com/assets.freshdesk.com/widget/freshwidget.js" />
    <style type="text/css" media="screen, projection">
      @import url(https://s3.amazonaws.com/assets.freshdesk.com/widget/freshwidget.css);
    </style>
    <Head>
      <title>
        {`${ui?.siteName} | Contact Us`}
      </title>
    </Head>
    <div className="main-container">
      <div className="login-box">
        <Row>
          <Col
            xs={24}
            sm={24}
            md={12}
            lg={12}
            className="login-content left fixed"
            style={ui.loginPlaceholderImage ? { backgroundImage: `url(${ui.loginPlaceholderImage})` } : null}
          />
          <Col
            xs={24}
            sm={24}
            md={12}
            lg={12}
            className="login-content right"
          >
            <iframe
              title="Feedback Form"
              className="freshwidget-embedded-form"
              id="freshwidget-embedded-form"
              src="https://stunnerz.freshdesk.com/widgets/feedback_widget/new?&widgetType=embedded&formTitle=Contact+us&submitTitle=Send&submitThanks=Thank+you.+we+will+get+back+to+you+soon."
              scrolling="no"
              height="500px"
              width="100%"
              frameBorder="0"
            />
          </Col>
        </Row>
      </div>
    </div>
  </Layout>
);
const mapStates = (state: any) => ({
  ui: state.ui
});
export default connect(mapStates)(ContactPage);
