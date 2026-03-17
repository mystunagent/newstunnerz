import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { BookEventListTable } from '@components/event/event-detail';
import { eventsService } from '@services/event.service';
import { message } from 'antd';
import Head from 'next/head';
import Router, { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function ViewDetailsEventPage() {
  const params = useRouter();
  const id = params.query?.id;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, any>>();
  const getDetails = async () => {
    try {
      setLoading(true);
      const result = await eventsService.searchPerformerBook({ eventId: id.toString() });
      setData(result.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  };

  const approveEvent = async (id: string) => {
    try {
      await eventsService.approveEvent({ id });
      message.success('Event approved successfully');
      getDetails();
    } catch (error) {
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  }

  const rejectEvent = async (id: string) => {
    try {
      await eventsService.rejectEvent({ id });
      message.success('Event rejected successfully');
      getDetails();
    } catch (error) {
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  }

  useEffect(() => {
    getDetails();
  }, []);

  return (
    <>
      <Head>
        <title>Details Event</title>
      </Head>
      <BreadcrumbComponent
        breadcrumbs={[
          { title: 'Event', href: '/event-list' },
          { title: 'View Event' }
        ]}
      />
      <Page>
        <div className="table-responsive">
          <BookEventListTable
            dataSource={data?.data}
            rowKey="_id"
            loading={loading}
            approve={approveEvent}
            reject={rejectEvent}
          />
        </div>
      </Page>
    </>
  );
}
