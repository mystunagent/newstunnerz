import BannerComponent from "@components/common/banner";
import BarTitleHome from "@components/common/base/bar-title-home";
import SearchModelStreamInStreaming from "@components/search/search-model-stream-for-streaming";
import { formatDateNotSecond } from "@lib/date";
import { upcomingStreamService } from "@services/upcoming-stream.service";
import { Card, Col, Image, Layout, message, Row } from "antd";
import moment from "moment";
import Router from "next/router";
import { useEffect, useState } from "react";
import "./upcoming-stream.less";

type IProps = {
  // eslint-disable-next-line react/require-default-props
  performer?: any;
  // eslint-disable-next-line react/no-unused-prop-types, react/require-default-props
  user?: any;
  settings: any;
  topBanners: any;
};

const { Meta } = Card;

export default function UpcomingBookStream({
  performer,
  settings,
  topBanners,
  user,
}: IProps) {
  const [loading, setLoading] = useState(false);
  const [dataUpcoming, setDataUpcoming] = useState<Record<string, any>>();
  const loadDataUpcoming = async () => {
    try {
      setLoading(true);
      let data;
      if (performer && performer._id) {
        data = await upcomingStreamService.userSearch({
          performerId: performer._id,
          limit: 12,
          offset: 0,
        });
      } else if (performer && performer._id === user._id) {
        data = await upcomingStreamService.performerSearch({
          limit: 12,
          offset: 0,
        });
      } else {
        data = await upcomingStreamService.userSearch({
          limit: 12,
          offset: 0,
        });
      }
      setDataUpcoming(data.data?.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  const handleRedirectToProfile = (data) => {
    Router.push(
      {
        pathname: "/creator/profile",
        query: { username: data?.performerInfo?.username || data?.performerId },
      },
      `/${data?.performerInfo?.username || data?.performerId}`
    );
  };

  useEffect(() => {
    loadDataUpcoming();
  }, []);

  const findUpcoming24hours =
    dataUpcoming &&
    dataUpcoming.filter((time) => {
      const now = new Date();
      const nextTwentyFourHours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const startAt = new Date(time.startAt);
      return startAt >= now && startAt <= nextTwentyFourHours;
    });

  const groupedEvents = [];
  findUpcoming24hours &&
    findUpcoming24hours.length > 0 &&
    findUpcoming24hours.forEach((schedule) => {
      const { startAt, endAt, performerInfo, title, isSubscribed, optionStream } = schedule;
      if (
        groupedEvents.length === 0 ||
        !groupedEvents.some(
          (event) => event.performerInfo.name === performerInfo.name
        )
      ) {
        groupedEvents.push({
          performerInfo,
          date: [{ startAt, endAt, title, isSubscribed, optionStream }],
        });
      } else {
        const existingEvent = groupedEvents.find(
          (event) => event.performerInfo.name === performerInfo.name
        );
        existingEvent.date.push({ startAt, endAt, title, isSubscribed, optionStream });
      }
    });

  return (
    <Layout>
      {!loading && dataUpcoming && dataUpcoming?.length > 0 && (
        <BannerComponent
          settings={settings?.speedBanner}
          banners={topBanners}
          width={453.5}
        />
      )}
      {/* <SearchModelStreamInStreaming user={user} performer={performer} /> */}
      {!loading && dataUpcoming && groupedEvents.length > 0 && (
        <BarTitleHome title="Upcoming Live Streaming" />
      )}
      <Row>
        {!loading &&
          dataUpcoming &&
          groupedEvents.length > 0 &&
          groupedEvents
            // .filter((i) => moment(i.endAt).isAfter(moment()))
            .map((d) => (
              <Col xs={12} md={8} lg={6}>
                <Card
                  className="card-upcoming-stream"
                  hoverable
                  onClick={() => handleRedirectToProfile(d)}
                  cover={
                    <Image
                      preview={false}
                      // width={240}
                      alt={d?.performerInfo?.avatar}
                      src={d?.performerInfo?.avatar || "/static/no-avatar.png"}
                    />
                  }
                >
                  <Meta
                    className="meta-username"
                    title={d?.performerInfo?.name || d?.performerInfo?.username}
                    description=" "
                  />
                  {d?.date
                    ?.filter((i) => moment(i.endAt).isAfter(moment()))
                    ?.sort(
                      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
                    )
                    ?.map((date) => (
                      <>
                        <Meta
                          className="meta-show"
                          title={date?.title}
                          description={`${formatDateNotSecond(
                            date?.startAt
                          )} → ${formatDateNotSecond(date?.endAt)}`}
                        />
                        <Meta
                          className="meta-show-mobile"
                          title={date?.title}
                          description={`${formatDateNotSecond(
                            date?.startAt
                          )} ↓ ${formatDateNotSecond(date?.endAt)}`}
                        />
                        <br />
                      </>
                    ))}
                </Card>
              </Col>
            ))}
      </Row>
    </Layout>
  );
}
