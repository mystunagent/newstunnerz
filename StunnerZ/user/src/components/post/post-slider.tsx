import { useMemo, useEffect, useState } from "react";
import { Carousel, Spin, Image } from "antd";
import { AudioPlayer } from "@components/common/audio-player";
import "./index.less";

interface IProps {
  feed: any;
}

export default function FeedSlider({ feed }: IProps) {
  const images = feed.files?.filter((f) => f.type === "feed-photo");
  const videos = feed.files?.filter((f) => f.type === "feed-video");
  const audios = feed.files?.filter((f) => f.type === "feed-audio");
  let processing = false;
  
  useEffect(() => {
    if ((feed.status !== "finished" && videos?.length > 0)) {
      processing = true;
    }
  }, [feed]);
  
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (playingVideoId) {
        const videoElement = document.getElementById(
          playingVideoId
        ) as HTMLVideoElement;
        const rect = videoElement?.getBoundingClientRect();
        if (rect && (rect.bottom < 0 || rect.top > window.innerHeight)) {
          videoElement.pause();
          setPlayingVideoId(null);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [playingVideoId]);

  return (
    <div
      className={feed.type === "audio" ? "feed-slider custom" : "feed-slider"}
    >
      {!processing && feed.files && feed.files.length > 0 && (
        <>
          {images && images.length > 0 && (
            <Image.PreviewGroup>
              <Carousel
                adaptiveHeight
                effect="fade"
                draggable
                swipe
                swipeToSlide
                arrows
                dots={false}
                infinite
              >
                {images.map(
                  (img) =>
                    img.url && (
                      <div className="image-wrapper" key={img._id}>
                        <img className="blur-bg" src={img.url} alt="" />
                        <Image
                          preview={{ maskClosable: false }}
                          src={img.url}
                          fallback="/static/no-image.jpg"
                          title={img.name}
                          width="100%"
                          alt="img"
                        />
                      </div>
                    )
                )}
              </Carousel>
            </Image.PreviewGroup>
          )}
          {videos &&
            videos.length > 0 &&
            videos.map((vid) => (
              <div className="image-wrapper" key={vid._id}>
                <img className="blur-bg" src={vid?.thumbnails[0]} alt="" />
                <div className="video-post">
                  <video
                    id={vid._id}
                    style={{ zIndex: 100, width: "100%" }}
                    src={vid.url}
                    controls
                    controlsList="nodownload noplaybackrate"
                    onPlay={() => setPlayingVideoId(vid._id)}
                    onPause={() => setPlayingVideoId(null)}
                  />
                </div>
              </div>
            ))}
          {audios &&
            audios.length > 0 &&
            audios.map((audio) => (
              <AudioPlayer key={audio._id} source={audio?.url} />
            ))}
        </>
      )}
      {processing && (
        <div className="proccessing">
          <Spin />
          <p>We&apos;re analyzing your video, it will be available shortly</p>
        </div>
      )}
    </div>
  );
}
