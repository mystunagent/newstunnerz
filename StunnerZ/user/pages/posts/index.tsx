import ScrollListFeed from "@components/post/scroll-list";
import { IFeed } from "@interfaces/feed";
import { IUIConfig } from "@interfaces/ui-config";
import { getFeeds, moreFeeds, removeFeedSuccess } from "@redux/feed/actions";
import { feedService } from "@services/feed.service";
import { Alert, Button, Col, Input, Layout, message, Row } from "antd";
import Head from "next/head";
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { SearchOutlined } from "@ant-design/icons";
import BannerComponent from "@components/common/banner";
import { bannerService } from "@services/banner.service";
import { ListFilterPosts } from "@components/posts/list-filter-post";
import { performerService, utilsService } from "@services/index";
import "./index.less";
import MenuRightPostPerformer from "@components/posts/menu-right-potst";

type IProps = {
  ui: IUIConfig;
  getFeeds: Function;
  moreFeeds: Function;
  feedState: any;
  settings: any;
  removeFeedSuccess: Function;
  user: any;
};

function PostsPage({
  feedState,
  getFeeds: getFeed,
  moreFeeds: moreFeed,
  removeFeedSuccess: removeFeed,
  ui,
  settings,
  user,
}: IProps) {
  const [limit] = useState(5);
  const [offset, setOffset] = useState(0);
  const [keyword] = useState("");
  const [orientation] = useState("");
  const [banner, setBanner] = useState([]);
  const [countries, setCountries] = useState<any>();
  const [filter, setFilter] = useState<Record<string, any>>();
  const [searchModel, setSearchModel] = useState("");
  const [randomPerformers, setRadomPerformer] = useState();
  const loadBanner = async () => {
    try {
      const { data } = await bannerService.search({ limit: 99 });
      setBanner(data?.data);
      const dataCountry = await utilsService.countriesList();
      setCountries(dataCountry?.data);
    } catch (error) {
      const e = await error;
      message.error(e || "An error occurred");
    }
  };
  const loadDataFeeds = async () => {
    await getFeed({
      q: keyword,
      orientation,
      limit,
      // isHome: !!user._id,
      offset: 0,
      ...filter,
    });
  };

  const loadRandomPerformer = async () => {
    try {
      const { data } = await performerService.randomSearch({
        isFreeSubscription: true,
      });
      if (user) {
        setRadomPerformer(data?.data.filter((p) => p._id !== user._id));
      }
      setRadomPerformer(data?.data);
    } catch (error) {
      const e = await error;
      message.error(e || "An error occurred");
    }
  };

  const {
    items: feeds,
    total: totalFeeds,
    requesting: loadingFeed,
  } = feedState;
  const loadMoreFeeds = async () => {
    setOffset(offset + 1);
    if (feeds.length >= totalFeeds) return;
    await moreFeed({
      limit,
      offset: (offset + 1) * limit,
      ...filter,
    });
  };

  const onDeleteFeed = async (feed: IFeed) => {
    if (!user._id) {
      message.error("Please login");
    }
    if (
      !window.confirm(
        "This post will be permanently removed and cannot be recovered. Do you wish to proceed?"
      )
    )
      return;
    try {
      await feedService.delete(feed._id);
      message.success("Post deleted successfully");
      removeFeed({ feed });
    } catch (e) {
      message.error("Something went wrong, please try again later");
    }
  };

  const handleFilter = (f: any) => {
    setFilter(f);
  };

  useEffect(() => {
    loadBanner();
    loadRandomPerformer();
  }, []);

  useEffect(() => {
    loadDataFeeds();
  }, [filter]);
  const topBanners =
    banner &&
    banner.length > 0 &&
    banner.filter((b) => b.position === "allPost");

  return (
    <Layout>
      <Head>
        <title>{ui && ui.siteName} | Posts</title>
      </Head>
      <BannerComponent
        settings={settings?.speedBanner}
        banners={topBanners}
        width={453.5}
      />
      <div>
        <Row>
          <Col xs={24} md={24} lg={24}>
            <div className="custom-filter-model-post">
              <div className="filter-block custom custom-main">
                <div className="custom-search">
                  <Input
                    placeholder="Search Creators ..."
                    onChange={(evt) => setSearchModel(evt.target.value)}
                    onPressEnter={() =>
                      handleFilter({ userPerformer: searchModel })
                    }
                  />
                </div>
                <div className="custom-btn">
                  <div className="custom-btn-item">
                    <Button onClick={() => handleFilter({ sort: "desc" })}>
                      Latest Post
                    </Button>
                  </div>
                  <div className="custom-btn-item">
                    <Button
                      onClick={() =>
                        handleFilter({
                          mostLike: true,
                          sort: "desc",
                          limit: 20,
                          offset: 0,
                        })
                      }
                    >
                      Most Liked
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} md={24} lg={4}>
            <ListFilterPosts handleFilter={handleFilter} />
          </Col>
          <Col xs={24} md={16} lg={14}>
            <br />
            {!loadingFeed && !totalFeeds && (
              <div className="text-center" style={{ margin: "10px 0" }}>
                <Alert
                  type="warning"
                  message={
                    <a href="/creator">
                      <SearchOutlined /> Find someone to follow
                    </a>
                  }
                />
              </div>
            )}
            <div className="main-container">
              {feeds && (
                <ScrollListFeed
                  items={feeds}
                  canLoadmore={feeds && feeds.length < totalFeeds}
                  loading={loadingFeed}
                  onDelete={onDeleteFeed.bind(this)}
                  loadMore={loadMoreFeeds.bind(this)}
                />
              )}
            </div>
          </Col>
          <Col xs={24} md={8} lg={6}>
            <MenuRightPostPerformer
              countries={countries}
              performers={randomPerformers}
            />
          </Col>
        </Row>
      </div>
    </Layout>
  );
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  feedState: { ...state.feed.feeds },
  settings: { ...state.settings },
  user: { ...state.user.current },
});

const mapDispatch = {
  getFeeds,
  moreFeeds,
  removeFeedSuccess,
};
PostsPage.authenticate = false;
export default connect(mapStates, mapDispatch)(PostsPage);
