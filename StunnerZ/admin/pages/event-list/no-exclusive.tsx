import Head from 'next/head';
import { PureComponent } from 'react';
import Page from '@components/common/layout/page';
import { BreadcrumbComponent } from '@components/common';
import { withRouter } from 'next/router';
import Title from 'antd/lib/typography/Title';

interface IProps {}

class EventListNoExclusive extends PureComponent<IProps> {
  static async getInitialProps() {}

  state = {};

  async componentDidMount() {}

  async componentDidUpdate() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleTableChange = async (pagi, filters, sorter) => {};

  async handleFilter() {}

  render() {
    return (
      <>
        <Head>
          <title>No Exclusive</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'No Exclusive' }]} />
        <Page>
          <Title>Event for Model</Title>
          <Title level={2}>Coming Soon</Title>
        </Page>
      </>
    );
  }
}

export default withRouter(EventListNoExclusive as any);
