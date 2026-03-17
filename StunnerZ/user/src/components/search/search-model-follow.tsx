import {
  Button, Col, Layout, Row, Spin
} from 'antd';
import './search-model-follow.less';
import Router from 'next/router';
import BarTitleHome from '@components/common/base/bar-title-home';
import { chunk } from 'lodash';
import Title from 'antd/lib/typography/Title';
import BannerComponent from '@components/common/banner';
import BtnFollow from './btn-follow';

type IProps = {
  randomPerformers: any;
  loading: boolean;
  user: any;
  settings: any;
  topBanners: any;
}
export default function SearchModelFollow({
  user, randomPerformers, loading, settings, topBanners
}: IProps) {
  const chunkPerformers = chunk(randomPerformers, 6);
  const handleClick = (data) => {
    Router.push(
      {
        pathname: '/creator/profile',
        query: { username: data?.username || data?._id }
      },
      `/${data?.username}`
    );
  };

  return (
    <Layout>
      {chunkPerformers && chunkPerformers.length > 0 && (
        <>
          <BarTitleHome title="Creators" />
          <div className="custom-model-follow">
            <Row>
              {chunkPerformers[0].map((item: any) => (
                <Col key={item._id} md={8} xl={4} lg={4} xs={12}>
                  <div onClick={() => handleClick(item)} aria-hidden>
                    <div
                      className="grid-card"
                      style={{
                        backgroundImage: `url(${
                          item?.avatar || '/static/no-avatar.png'
                        })`
                      }}
                    >
                      {/* <BtnFollow user={user} performer={item} /> */}
                    </div>
                  </div>
                  <div>
                    <Title level={4} className="custom-model-name">
                      {item.name || 'N/A'}
                    </Title>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
          <div className="text-center">
            <Button className="live-status-button" onClick={() => Router.push('/creator')}>
              Show All Creators
            </Button>
          </div>
        </>
      )}
      {loading && (
        <div className="text-center">
          <Spin />
        </div>
      )}
      {chunkPerformers && chunkPerformers.length > 0 && !loading && (
        <BannerComponent settings={settings} banners={topBanners} width={302.362} />
      )}
    </Layout>
  );
}
