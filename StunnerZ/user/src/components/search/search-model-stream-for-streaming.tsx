import { performerService } from '@services/performer.service';
import {
  Button,
  Col, Layout, message, Row,
  Spin
} from 'antd';
import { useEffect, useState } from 'react';
import './search-model-stream.less';
import { useDispatch } from 'react-redux';
import Router from 'next/router';
import { showSubscribePerformerModal } from '@redux/subscription/actions';
import BarTitleHome from '@components/common/base/bar-title-home';
import PerformerGridCardLiveStream from '@components/performer/grid-card-live';

type IProps = {
  user: any;
  performer: any;
}

export default function SearchModelStreamInStreaming({ user, performer }: IProps) {
  const limit = 6;
  const [modelStream, setModelStream] = useState<any>();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const handleClick = (data) => {
    if (!user._id) {
      message.error('Please log in or register!', 5);
      Router.push('/');
      return;
    }
    if (user.isPerformer) return;
    if(data?.streamingStatus === 'private') {
      message.error(`${data?.name || data?.username} is currently in a private stream. Please try again later.`, 5);
      return;
    }
    if (data?.optionStream === 'subscribe' && !data?.isSubscribed) {
      message.error('Please subscribe to join live chat!', 5);
      dispatch(showSubscribePerformerModal(data.performerId));
      return;
    }
    Router.push(
      {
        pathname: '/streaming/details',
        query: { username: data?.username || data?._id }
      },
      `/streaming/${data?.username || data?._id}`
    );
  };

  const loadModelStream = async (page = 1) => {
    const offset = (page - 1) * limit;
    try {
      setLoading(true);
      const { data } = await performerService.searchNoAuth({
        limit,
        offset,
        sortBy: 'online',
        type: 'live',
        sort: 'live'
      });
      setModelStream(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  };

  useEffect(() => {
    loadModelStream();
  }, []);

  return (
    <Layout>
      {modelStream && modelStream.data.filter((item) => item?._id !== performer?._id).length > 0 && (
      <>
        <BarTitleHome title="Currently Live" />
        <div className="custom-model-live">
          <Row>
            {modelStream && modelStream.data.filter((item) => item?._id !== performer?._id).map((item) => (
              <Col key={item?._id} md={8} xl={4} lg={4} xs={12}>
                <PerformerGridCardLiveStream redirect={() => handleClick(item)} performer={item} />
              </Col>
            ))}
          </Row>
          <div className="text-center">
            <Button onClick={() => Router.push('/creator/all-live')}>Show All Live</Button>
          </div>
        </div>
      </>
      )}
      {loading && (
      <div className="text-center">
        <Spin />
      </div>
      )}
    </Layout>
  );
}
