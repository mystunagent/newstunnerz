import Head from 'next/head';
import Page from '@components/common/layout/page';
import { BreadcrumbComponent } from '@components/common';
import MassMessageCreate from '@components/mass-message';

function MassMessagePage() {
  return (
    <>
      <Head>
        <title>Create new mass message</title>
      </Head>
      <BreadcrumbComponent
        breadcrumbs={[{ title: 'Create new mass message' }]}
      />
      <Page>
        <MassMessageCreate />
      </Page>
    </>
  );
}

export default MassMessagePage;
