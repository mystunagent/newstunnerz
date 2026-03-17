import {
  Button, DatePicker, Layout, message, Select
} from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';

type IProps = {
  // eslint-disable-next-line react/require-default-props
  data?: any;
  onSubmit: Function;
  loading: boolean;
};
const { RangePicker } = DatePicker;

export default function UploadTimeStream({ loading, onSubmit, data }: IProps) {
  const [startAt, setStartAt] = useState<any>(data?.startAt);
  const [endAt, setEndAt] = useState<any>(data?.endAt);
  const [status, setStatus] = useState('active');

  const handleUpload = async () => {
    if (!startAt || !endAt) {
      message.error('Please select date');
      return;
    }

    try {
      await onSubmit({ status, startAt: moment(startAt).toISOString(), endAt: moment(endAt).toISOString() });
      setStartAt('');
      setEndAt('');
    } catch (error) {
      const e = await error;
      message.error(e.message || 'An error occurred while loading');
    }
  };
  useEffect(() => {
    if (data) {
      setStartAt(data?.startAt);
      setEndAt(data?.endAt);
    }
  }, [data]);

  return (
    <Layout>
      <RangePicker
        value={[moment(startAt), moment(endAt)]}
        style={{ width: '100%' }}
        // defaultValue={data && data._id ? [moment(startAt), moment(endAt)] : null}
        onChange={(dates: [any, any]) => {
          setStartAt(dates[0]);
          setEndAt(dates[1]);
        }}
        showTime={{ format: 'HH:mm' }}
        format="DD/MM/YYYY HH:mm"
        disabledDate={(current) => current && current < moment().subtract(1, 'day')}
        allowClear={false}
      />
      <br />
      <Select
        style={{ width: '100%' }}
        defaultValue={data ? data.status : 'active'}
        onSelect={(e) => setStatus(e.toString())}
        placeholder="Select status"
      >
        <Select.Option value="active">Active</Select.Option>
        <Select.Option value="inactive">Inactive</Select.Option>
      </Select>
      <br />
      <Button onClick={handleUpload} loading={loading} disabled={loading} type="primary">Submit</Button>
    </Layout>
  );
}
