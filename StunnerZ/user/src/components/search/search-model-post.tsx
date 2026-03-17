import {
  Col, Layout, Row, Spin
} from 'antd';
import './search-model-post.less';
import BarTitleHome from '@components/common/base/bar-title-home';
import { useEffect, useState } from 'react';
import { feedService } from '@services/feed.service';
import Link from 'next/link';
import FeedCard from '../post/post-card';

type IProps = {
  // eslint-disable-next-line react/require-default-props
  limit?: number;
  user: any;
}
export default function HomeLatestFeeds({
  limit = 2,
  user
}: IProps) {
  const [feeds, setFeeds] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const loadFeeds = async () => {
      setFetching(true);
      let resp;
      if (user._id) {
        resp = await feedService.userHomeFeeds({
          limit
        });
      } else {
        resp = await feedService.userSearch({
          limit
        });
      }

      setFetching(false);
      setFeeds(resp.data.data);
    };

    loadFeeds();
  }, []);

  if (fetching) {
    return (
      <Layout>
        <div className="text-center">
          <Spin />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BarTitleHome title="Latest Posts" />
      <div className="custom-model-post">
        <Row>
          {feeds.map((item: any) => (
            <>
              <Col xl={1} lg={1} />
              <Col key={item._id} md={24} xl={10} lg={10} xs={24}>
                <div className="setup-post-home">
                  <div className="fixed-scroll">
                    <FeedCard feed={item} key={item._id} onDelete={() => { }} />
                  </div>
                </div>
              </Col>
              <Col xl={1} lg={1} />
            </>
          ))}
        </Row>
      </div>
      <div className="text-center">
        <Link href={{
          pathname: '/posts'
        }}
        >
          <a className="live-status-button">
            View All Posts
          </a>
        </Link>
      </div>
    </Layout>
  );
}
