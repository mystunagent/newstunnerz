import { formatDateNotSecond } from '@lib/date';
import {
  Button, Modal, Table
} from 'antd';
import { useState } from 'react';
import BtnBookEvent from './btn-book_event';
import BtnSeeFileEvent from './btn-see-file-event';

type IProps = {
  dataSource: any;
  rowKey: any;
  loading: boolean;
  onChange: Function;
  pagination: any;
  user: any;
};

export default function EventListTable({
  dataSource,
  loading,
  onChange,
  pagination,
  rowKey,
  user
}: IProps) {
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState([]);

  const columns = [
    {
      title: 'Event',
      dataIndex: 'name',
      render(name) {
        return <span>{name}</span>;
      }
    },
    {
      title: 'Start At',
      dataIndex: 'startAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDateNotSecond(date)}</span>;
      }
    },
    {
      title: 'End At',
      dataIndex: 'endAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDateNotSecond(date)}</span>;
      }
    },
    {
      title: 'Location',
      dataIndex: 'address',
      render(address) {
        return (
          <div style={{
            whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
          }}
          >
            {address}
          </div>
        );
      }
    },
    {
      title: 'Hosted',
      dataIndex: 'hosted',
      render(hosted) {
        return (
          <div style={{
            whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
          }}
          >
            {hosted}
          </div>
        );
      }

    },
    {
      title: 'Price',
      dataIndex: 'price',
      render(price: number) {
        return (
          <span>
            $
            {price}
          </span>
        );
      }
    },
    {
      title: 'Availability',
      dataIndex: 'availability',
      render(availability) {
        return (
          <span>
            {availability}
          </span>
        );
      }
    },
    {
      title: 'Request Participation',
      dataIndex: 'book',
      render(index, data) {
        return (
          <div>
            <BtnBookEvent performer={user} data={data} id={data?._id.toString()} />
          </div>
        );
      }

    },
    {
      title: 'Info/Eligibility',
      width: 150,
      dataIndex: 'info',
      render(info) {
        return (
          <div style={{ width: '200px' }}>
            {info}
          </div>
        );
      }
    },
    {
      title: 'Brochure',
      dataIndex: 'file',
      render(index, data) {
        return (
          <div>
            <Button onClick={() => { setValues(data); setVisible(true); }}>See Brochure</Button>
          </div>
        );
      }
    }
  ];

  return (
    <>
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: false }}
        onChange={onChange.bind(this)}
      />
      <Modal visible={visible} onCancel={() => setVisible(false)} footer={false}>
        <BtnSeeFileEvent data={values} />
      </Modal>
    </>
  );
}
