import { Layout } from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import { IUIConfig } from 'src/interfaces/';
import Messenger from '@components/messages/Messenger';
import { resetMessageState } from '@redux/message/actions';
import Router from 'next/router';

interface IProps {
  ui: IUIConfig;
  query: Record<string, string>;
  resetMessageState: Function;
  currentUser: any;
}

class Messages extends PureComponent<IProps> {
  static authenticate = true;

  static getInitialProps({ ctx }) {
    return {
      query: ctx.query
    };
  }

  componentDidMount(): void {
    const { currentUser } = this.props;
    if(currentUser?.infoSubPerformer?._id && !currentUser?.infoBankSubPerformer){
      Router.push('/home');
      return;
    }
    if (currentUser?.infoSubPerformer?._id && (!currentUser?.infoSubPerformer?.privilege.includes('all')
      && !currentUser?.infoSubPerformer?.privilege.includes('messages'))) {
      Router.push('/home');
    }
  }

  componentWillUnmount() {
    const { resetMessageState: resetStateHandler } = this.props;
    resetStateHandler();
  }

  render() {
    const { ui, query = {} } = this.props;
    return (
      <>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Messages
          </title>
        </Head>
        <Layout>
          <div className="main-container">
            <Messenger toSource={query.toSource} toId={query.toId} />
          </div>
        </Layout>
      </>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  currentUser: state.user.current
});

const mapDispatch = { resetMessageState };
export default connect(mapStates, mapDispatch)(Messages);
