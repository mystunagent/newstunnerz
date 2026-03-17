import GalleryCard from '@components/gallery/gallery-card';
import { PerformerListProduct } from '@components/product/performer-list-product';
import { PerformerListVideo } from '@components/video';
import { feedService } from '@services/feed.service';
import { galleryService } from '@services/gallery.service';
import { productService } from '@services/product.service';
import { videoService } from '@services/video.service';
import FeedCard from '@components/post/post-card';
import {
  Col, Layout, message, Row, Spin
} from 'antd';
import { useEffect, useState } from 'react';

type IProps = {
  performer: any;
};

export default function InfoAllProductPerformer({ performer }: IProps) {
  const limit = 6;
  const offset = 0;
  const sort = 'desc';
  const sortBy = 'updatedAt';
  const [loading, setLoading] = useState(false);
  const [dataVideo, setDataVideo] = useState<Record<string, any>>();
  const [dataGallery, setDataGallery] = useState<Record<string, any>>();
  const [dataProduct, setDataProduct] = useState<Record<string, any>>();
  const [dataPost, setDataPost] = useState<Record<string, any>>();

  const loadDataItems = async () => {
    try {
      setLoading(true);
      const [video, gallery, product, post] = await Promise.all([
        await videoService.userSearch({
          performerId: performer._id,
          limit,
          offset,
          sort,
          sortBy
        }),
        await galleryService.userSearch({
          performerId: performer._id,
          limit,
          offset,
          sort,
          sortBy
        }),
        await productService.userSearch({
          performerId: performer._id,
          limit,
          offset,
          sort,
          sortBy
        }),
        await feedService.userSearch({
          performerId: performer._id,
          limit,
          offset,
          sort,
          sortBy
        })
      ]);
      setDataVideo(video?.data?.data);
      setDataGallery(gallery?.data?.data);
      setDataProduct(product?.data?.data);
      setDataPost(post?.data?.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  };

  useEffect(() => {
    loadDataItems();
  }, []);

  return (
    <Layout>
      <Row>
        {/* video */}
        <Col xs={24} md={24} lg={24}>
          <h3>
            <strong>
              Videos
            </strong>
          </h3>
          {dataVideo && (
            <div>
              <PerformerListVideo videos={dataVideo} />
            </div>
          )}
        </Col>
        {/* gallery */}
        <Col xs={24} md={24} lg={24}>
          <h3>
            <strong>
              Galleries
            </strong>
          </h3>
          <Row>
            {dataGallery
              && dataGallery.map((item) => (
                <Col xs={12} md={12} lg={8}>
                  <div>
                    <GalleryCard gallery={item} />
                  </div>
                </Col>
              ))}
          </Row>
        </Col>
        {/* product */}
        <Col xs={24} md={24} lg={24}>
          <h3>
            <strong>
              Products
            </strong>
          </h3>
          {dataProduct && <PerformerListProduct products={dataProduct as any} />}
        </Col>
        {/* posts */}
        <Col xs={24} md={24} lg={24}>
          <h3>
            <strong>
              Posts
            </strong>
          </h3>
          <Row>
            {dataPost
              && dataPost.map((item) => (
                <Col xs={24} md={12} lg={8}>
                  <div>
                    <FeedCard hideText feed={item} key={item._id} onDelete={() => {}} />
                  </div>
                </Col>
              ))}
          </Row>
        </Col>
        {loading && (
          <div className="text-center">
            <Spin />
          </div>
        )}
      </Row>
    </Layout>
  );
}
