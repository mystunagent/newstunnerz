/* eslint-disable react/destructuring-assignment */
import {
  Table, Tag, Avatar, Tooltip, Modal, message, Image
} from 'antd';
import { ITransaction } from 'src/interfaces';
import { formatDateNotSecond } from '@lib/date';
import Link from 'next/link';
import './payment-token-history-table.less';
import { useState } from 'react';
import { VideoPlayer } from '@components/common';
import { messageService } from '@services/message.service';

interface IProps {
  dataSource: ITransaction[];
  pagination: {};
  rowKey: string;
  loading: boolean;
  onChange: Function;
}

const PaymentTableList = ({
  dataSource,
  pagination,
  rowKey,
  loading,
  onChange
}: IProps) => {
  const [showPopupMessage, setShowPopupMessage] = useState(false);
  const [filePaidContentMessage, setfilePaidContentMessage] = useState(null);
  const [textMessage, setTextMessage] = useState('');
  const [typeMessage, setTypeMessage] = useState('');

  const handleOpenModalMessage = async (record) => {
    try {
      const resp = await messageService.getPaidContentMessages(record?.products[0]?.productId);
      setfilePaidContentMessage(resp?.data);
      setTextMessage(resp?.data?.text);
      if (resp?.data?.fileUrl) {
        setShowPopupMessage(true);
      }
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Error occured, please try again later!');
    }
  };
  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: 'id',
      render(data, record) {
        let url = '/';
        let as = '/';
        let query = {};
        switch (record.target) {
          case 'performer':
            url = '/creator/profile';
            as = `/${record?.performerInfo?.username || record?.performerInfo?._id}`;
            query = {
              username: record?.performerInfo?.username || record?.performerInfo?._id
            };
            break;
          case 'stream':
            url = '/creator/profile';
            as = `/${record?.performerInfo?.username || record?.performerInfo?._id}`;
            query = {
              username: record?.performerInfo?.username || record?.performerInfo?._id
            };
            break;
          case 'message':
            url = '/sexting';
            as = `/sexting?toId=${record?.performerId}&toSource=performer`;
            query = {
              toSource: 'performer',
              toId: record?.performerId
            };
            break;
          case 'feed':
            url = `/post?id=${record?.targetId}`;
            as = `/post/${record?.targetId}`;
            query = {
              id: record?.targetId
            };
            break;
          case 'product':
            url = '/store';
            as = `/store/${record?.targetId}`;
            query = {
              id: record?.targetId
            };
            break;
          case 'video':
            url = '/video';
            as = `/video/${record?.targetId}`;
            query = {
              id: record?.targetId
            };
            break;
          case 'gallery':
            url = '/gallery';
            as = `/gallery/${record?.targetId}`;
            query = {
              id: record?.targetId
            };
            break;
          case 'booking-stream':
            url = '/user/booking-stream';
            as = '/user/booking-stream';
            break;
          default: null;
        }
        return (
          record.type === 'message' ? (
            <a
              aria-hidden
              style={{ textTransform: 'uppercase', fontWeight: 600 }}
              onClick={() => handleOpenModalMessage(record)}
            >
              {record._id.slice(16, 24)}
            </a>
          ) : (
            <Link
              href={{
                pathname: url,
                query
              }}
              as={as}
            >
              <a style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                {record._id.slice(1, 24)}
              </a>
            </Link>
          )
        );
      }
    },
    {
      title: 'Creator',
      dataIndex: 'performerInfo',
      key: 'performer',
      render(data) {
        return (
          <span style={{ whiteSpace: 'nowrap' }}>
            <Avatar src={data?.avatar || '/static/no-avatar.png'} />
            {' '}
            {data?.name || data?.username || 'N/A'}
          </span>
        );
      }
    },
    {
      title: 'Description',
      key: 'description',
      render(data, record) {
        return record?.products.map((re) => (
          <Tooltip key={record._id} title={re.description}>
            <span style={{ whiteSpace: 'nowrap', maxWidth: 150, textOverflow: 'ellipsis' }}>
              {re.description || '#No description'}
            </span>
          </Tooltip>
        ));
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render(type: string, record) {
        switch (type) {
          case 'feed':
            return <Tag color="blue">Post</Tag>;
          case 'video':
            return <Tag color="pink">Video</Tag>;
          case 'product':
            return <Tag color="orange">Product</Tag>;
          case 'gallery':
            return <Tag color="violet">Gallery</Tag>;
          case 'message':
            if (record?.products[0]?.productType === 'message photo') {
              setTypeMessage('Message Photo');
              return <Tag color="red">Message Photo</Tag>;
            }
            if (record?.products[0]?.productType === 'message video') {
              setTypeMessage('Message Video');
              return <Tag color="blue">Message Video</Tag>;
            }
            return <Tag color="red">Message</Tag>;
          case 'tip':
            return <Tag color="red">Creator Tip</Tag>;
          case 'stream_tip':
            return <Tag color="red">Streaming Tip</Tag>;
          case 'public_chat':
            return <Tag color="pink">Public Paid Streaming</Tag>;
          case 'private_chat':
            return <Tag color="purple">Private Paid Streaming</Tag>;
          default: return <Tag color="default">{type}</Tag>;
        }
      }
    },
    {
      title: 'Price',
      dataIndex: 'totalPrice',
      key: 'tokens',
      render(totalPrice) {
        return (
          <span style={{ whiteSpace: 'nowrap' }}>
            $
            {(totalPrice || 0).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render(status: string) {
        switch (status) {
          case 'pending':
            return <Tag color="blue">Pending</Tag>;
          case 'success':
            return <Tag color="green">Success</Tag>;
          case 'refunded':
            return <Tag color="red">Refunded</Tag>;
          default: return <Tag color="default">{status}</Tag>;
        }
      }
    },
    {
      title: 'Date',
      key: 'createdAt',
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDateNotSecond(date)}</span>;
      }
    }
  ];
  return (
    <>
      <div className="table-responsive table-wallet-transactions">
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={pagination}
          rowKey={rowKey}
          loading={loading}
          onChange={onChange.bind(this)}
        />
      </div>
      <Modal
        key="welcome-video"
        className="welcome-video"
        width={500}
        visible={showPopupMessage}
        title={typeMessage}
        centered
        onCancel={() => setShowPopupMessage(false)}
        footer={null}
      >
        {filePaidContentMessage?.fileType === 'video'
          && (
          <VideoPlayer {...{
            key: 'video-message-transsaction',
            controls: true,
            muted: true,
            autoplay: false,
            loop: true,
            playsinline: true,
            sources: [
              {
                src: filePaidContentMessage?.fileUrl,
                type: 'video/mp4'
              }
            ]
          }}
          />
          )}
        {filePaidContentMessage?.fileType === 'photo' && (
        <Image
          alt=""
          src={filePaidContentMessage?.fileUrl}
          preview
        />
        )}
        <span>{textMessage}</span>
      </Modal>
    </>
  );
};
export default PaymentTableList;
