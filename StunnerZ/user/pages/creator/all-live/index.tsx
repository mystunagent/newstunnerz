import { performerService } from "@services/performer.service";
import { Button, Col, Layout, message, Row, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import PerformerGridCardLiveStream from "@components/performer/grid-card-live";
import { connect, useDispatch } from "react-redux";
import Router from "next/router";
import Head from "next/head";
import { IUIConfig } from "@interfaces/ui-config";
import { bannerService } from "@services/banner.service";
import BannerComponent from "@components/common/banner";
import { utilsService } from "@services/utils.service";
import { OptionsFilterPerformer } from "@components/common/base/options-filter-model";
import UpcomingBookStream from "@components/performer/upcoming-stream";
import { PerformerAdvancedFilterAllLive } from "@components/common/base/filter-all-live";
import { OptionsFilterPerformerOnMobile } from "@components/common/base/options-filter-model-mobile";

type IProps = {
  user: any;
  ui: IUIConfig;
  settings: any;
};

function AllModelLive({ user, ui, settings }: IProps) {
  const limit = 12;
  const [off, setOff] = useState<any>(0);
  const [modelStream, setModelStream] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState([]);
  const [bodyInfo, setBodyInfo] = useState();
  const [countries, setCountries] = useState<Record<string, any>>();
  const [filter, setFilter] = useState<Record<string, any>>();
  const [usernamePerformers, setUsernamePerformers] = useState<any>();
  const dispatch = useDispatch();
  const page = useRef(1);

  const loadBanner = async () => {
    try {
      const { data } = await bannerService.search({ limit: 99 });
      setBanner(data?.data);
    } catch (error) {
      const e = await error;
      message.error(e || "An error occurred");
    }
  };
  const loadBodyInfo = async () => {
    try {
      const info = await utilsService.bodyInfo();
      setBodyInfo(info?.data);
    } catch (error) {
      const e = await error;
      message.error(e || "An error occurred");
    }
  };
  const loadCountries = async () => {
    try {
      const info = await utilsService.countriesList();
      setCountries(info?.data);
    } catch (error) {
      const e = await error;
      message.error(e || "An error occurred");
    }
  };
  const handleClick = (data) => {
    if (!user?._id) {
      message.error("Please log in or register!", 5);
      Router.push("/auth/login");
      return;
    }
    if (user.isPerformer) return;
    if (data.streamingStatus === "private") {
      message.error(
        `${
          data?.name || data?.username
        } is currently in a private stream. Please try again later.`,
        5
      );
      return;
    }
    if (data.liveInfo?.optionStream === "subscribe" && !data.isSubscribed) {
      message.error("Please subscribe to join live chat!", 5);
      setTimeout(() => {
        Router.push(`/${data?.username}`);
      }, 3000);
      return;
    }
    Router.push(
      {
        pathname: "/streaming/details",
        query: { username: data?.username || data?._id },
      },
      `/streaming/${data?.username || data?._id}`
    );
  };

  const getUsernamePerformer = async () => {
    const li = 12;
    try {
      const resp = await performerService.search({
        limit: 12,
        offset: off ? off * li : 0,
      });
      if (usernamePerformers?.data.length > 0) {
        setUsernamePerformers({
          data: [...usernamePerformers.data, ...resp.data.data],
          total: resp.data.total,
        });
      } else {
        setUsernamePerformers(resp.data);
      }
    } catch (error) {
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  const loadModelStream = async (reload?: boolean) => {
    const offset = (page.current - 1) * limit;
    try {
      setLoading(true);
      let resp;
      if (user && user._id) {
        resp = await performerService.search({
          limit,
          offset,
          ...filter,
          sortBy: "online",
          type: "live",
          sort: "live",
        });
      } else {
        resp = await performerService.searchNoAuth({
          limit,
          offset,
          ...filter,
          sortBy: "online",
          type: "live",
          sort: "live",
        });
      }
      if (!reload && modelStream?.data.length > 0) {
        setModelStream({
          data: [...modelStream.data, ...resp.data.data],
          total: resp.data.total,
        });
      } else {
        setModelStream(resp.data);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const e = await error;
      message.error(e.message || "An error occurred");
    }
  };

  const handleFilter = async (values: any) => {
    setFilter((prevFilter) => ({
      ...prevFilter,
      ...values,
    }));
  };

  const loadMore = async () => {
    page.current += 1;
    await loadModelStream();
  };

  const loadMoreUserName = async () => {
    setOff(off + 1);
  };

  useEffect(() => {
    if (
      user?.infoSubPerformer?._id &&
      !user?.infoSubPerformer?.privilege.includes("all")
    ) {
      Router.push("/");
      return;
    }
    loadBanner();
    loadBodyInfo();
    loadCountries();
  }, []);

  useEffect(() => {
    loadModelStream(true);
  }, [filter]);

  useEffect(() => {
    getUsernamePerformer();
  }, [off]);

  const topBanners =
    banner && banner.length > 0 && banner.filter((b) => b.position === "live");
  const topBannersStream =
    banner &&
    banner.length > 0 &&
    banner.filter((b) => b.position === "liveStreaming");
  const availableBannersStream =
    banner &&
    banner.length > 0 &&
    banner.filter((b) => b.position === "availableStream");

  return (
    <Layout>
      <Head>
        <title>{ui && ui.siteName} | Live</title>
      </Head>
      <BannerComponent
        settings={settings?.speedBanner}
        banners={topBanners}
        width={453.5}
      />
      <>
        <div className="custom-model-live">
          <Row>
            <Col lg={24} xs={16} md={24}>
              <PerformerAdvancedFilterAllLive
                onSubmit={handleFilter}
                bodyInfo={bodyInfo}
                type="live"
              />
            </Col>
            <Col lg={24} xs={8} md={24}>
              {bodyInfo && countries && (
                <OptionsFilterPerformerOnMobile
                  onSubmit={handleFilter}
                  countries={countries as any}
                  bodyInfo={bodyInfo}
                  username={usernamePerformers?.data}
                  loadMore={loadMoreUserName}
                  total={usernamePerformers?.total}
                />
              )}
            </Col>
          </Row>
          <Row>
            <Col lg={4} xs={0} md={24}>
              {bodyInfo && countries && (
                <OptionsFilterPerformer
                  onSubmit={handleFilter}
                  countries={countries as any}
                  bodyInfo={bodyInfo}
                  username={usernamePerformers?.data}
                  loadMore={loadMoreUserName}
                  total={usernamePerformers?.total}
                />
              )}
            </Col>
            <Col lg={20} xs={24} md={24}>
              <Row>
                {modelStream &&
                  modelStream.data.map((item) => (
                    <Col key={item?._id} xs={12} sm={12} md={8} lg={6}>
                      <PerformerGridCardLiveStream
                        redirect={() => handleClick(item)}
                        performer={item}
                      />
                    </Col>
                  ))}
              </Row>
              {modelStream && modelStream.data.length <= 0 && !loading && (
                // <p className="text-center" style={{ margin: 20, fontSize: '32px', fontWeight: 'bold' }}>
                //   Live streaming isn't available at the moment.
                // </p>
                <BannerComponent
                  settings={settings?.speedBanner}
                  banners={availableBannersStream}
                  width={453.5}
                />
              )}
              {loading && (
                <div className="text-center">
                  <Spin />
                </div>
              )}

              {modelStream && modelStream.data.length > 0 && (
                <div className="text-center">
                  <Button
                    type="primary"
                    onClick={loadMore}
                    disabled={
                      modelStream &&
                      modelStream.data.length === modelStream.total
                    }
                  >
                    Show More
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </div>
      </>
      {/* banner */}
      {/* for future bookings */}
      <UpcomingBookStream
        settings={settings}
        user={user}
        topBanners={topBannersStream}
      />
    </Layout>
  );
}

const mapStates = (state: any) => ({
  user: { ...state.user.current },
  ui: { ...state.ui },
  settings: { ...state.settings },
});
AllModelLive.authenticate = false;
export default connect(mapStates)(AllModelLive);
