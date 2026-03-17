import { Carousel, Image } from 'antd';

interface IProps {
  banners: any;
  // eslint-disable-next-line react/require-default-props
  width?: number;
  settings: any;
}

function BannerComponent({ banners, width, settings }: IProps) {

  return (
    <div>
      {banners && banners.length > 0
      && (
        <Carousel
          effect="fade"
          adaptiveHeight
          autoplay
          swipeToSlide
          arrows
          dots={false}
          autoplaySpeed={settings ? (settings * 1000) : 3000}
        >
          {banners.map((item) => (
            <a key={item._id} href={(item.link || null)} target="_.blank">
              <Image
                preview={false}
                src={item?.photo?.url}
                alt="banner"
                key={item._id}
                // height={width || 420}
              />
            </a>
          ))}
        </Carousel>
      )}
    </div>
  );
}

export default BannerComponent;
