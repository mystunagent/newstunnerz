import { PureComponent } from "react";
import { Row, Col, Layout, Pagination, Spin, message } from "antd";
import { connect } from "react-redux";
import PerformerGridCard from "@components/performer/grid-card";
import Head from "next/head";
import { IBanner, IUIConfig } from "src/interfaces/";
import { bannerService, performerService, utilsService } from "src/services";
import "@components/performer/performer.less";
import BannerComponent from "@components/common/banner";
import { PerformerAdvancedFilter } from "@components/common/base/filter-model";
import { OptionsFilterPerformer } from "@components/common/base/options-filter-model";
import { OptionsFilterAllCreatorOnMobile } from "@components/common/base/options-filter-all-creator-mobile";

interface IProps {
  ui: IUIConfig;
  countries: any;
  bodyInfo: any;
  banners: IBanner[];
  settings: any;
}

class Performers extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  static async getInitialProps() {
    const [banners, countries, bodyInfo] = await Promise.all([
      bannerService.search({ limit: 99 }),
      utilsService.countriesList(),
      utilsService.bodyInfo(),
    ]);
    return {
      banners: banners?.data?.data || [],
      countries: countries?.data || [],
      bodyInfo: bodyInfo?.data,
    };
  }

  state = {
    offset: 0,
    limit: 12,
    current: 1,
    off: 0,
    filter: {
      sortBy: "latest",
    } as any,
    performers: [],
    total: 0,
    fetching: true,
    usernamePerformers: null,
    totalUsername: 0,
  };

  componentDidMount() {
    this.getUsernamePerformer();
    this.getPerformers();
  }

  async handleFilter(values: any) {
    const { filter } = this.state;
    this.setState({
      offset: 0,
      current: 1,
      filter: { ...filter, ...values },
    });
    await this.pageChanged(1);
    // await this.getPerformers();
  }

  async getPerformers() {
    const { limit, offset, filter } = this.state;

    try {
      this.setState({ fetching: true });
      const resp = await performerService.search({
        limit,
        offset: limit * offset,
        ...filter,
      });
      this.setState({
        performers: resp.data.data,
        total: resp.data.total,
        fetching: false,
      });
    } catch {
      message.error("Error occurred, please try again later");
      this.setState({ fetching: false });
    }
  }

  async getUsernamePerformer(li?: number, off?: number) {
    const { usernamePerformers } = this.state;

    try {
      const resp = await performerService.search({
        limit: li || 12,
        offset: off ? off * li : 0,
      });
      if (usernamePerformers?.length > 0) {
        this.setState({
          usernamePerformers: [...usernamePerformers, ...resp.data.data],
          totalUsername: resp.data.total,
        });
      } else {
        this.setState({
          usernamePerformers: resp.data.data,
          totalUsername: resp.data.total,
        });
      }
    } catch {
      message.error("Error occurred, please try again later");
      this.setState({ fetching: false });
    }
  }

  pageChanged = async (page: number) => {
    this.setState({ offset: page - 1, current: page }, () => {
      this.getPerformers();
    });
  };

  loadMoreUserName = async () => {
    const { off } = this.state;
    const li = 12;
    this.setState({ off: off + 1 }, () => {
      this.getUsernamePerformer(li, off + 1);
    });
  };

  render() {
    const { ui, countries, bodyInfo, banners, settings } = this.props;
    const {
      limit,
      current,
      performers,
      fetching,
      total,
      usernamePerformers,
      totalUsername,
    } = this.state;
    const topBanners =
      banners &&
      banners.length > 0 &&
      banners.filter((b) => b.position === "allCreator");

    return (
      <Layout>
        <Head>
          <title>{ui && ui.siteName} | Creators</title>
        </Head>
        <div>
          <BannerComponent
            settings={settings?.speedBanner}
            banners={topBanners}
            width={453.5}
          />
        </div>
        <Row>
          <Col lg={24} xs={24} md={24}>
            <PerformerAdvancedFilter
              onSubmit={this.handleFilter.bind(this)}
              bodyInfo={bodyInfo}
            />
          </Col>
          <Col lg={24} xs={24} md={24}>
            {bodyInfo && countries && (
              <OptionsFilterAllCreatorOnMobile
                onSubmit={this.handleFilter.bind(this)}
                countries={countries}
                bodyInfo={bodyInfo}
                username={usernamePerformers}
                loadMore={this.loadMoreUserName}
                total={totalUsername}
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col lg={4} xs={0} md={24}>
            <OptionsFilterPerformer
              onSubmit={this.handleFilter.bind(this)}
              countries={countries}
              bodyInfo={bodyInfo}
              username={usernamePerformers}
              loadMore={this.loadMoreUserName}
              total={totalUsername}
            />
          </Col>
          <Col lg={20} xs={24} md={24}>
            <Row>
              {performers &&
                performers.length > 0 &&
                performers.map((p) => (
                  <Col xs={12} sm={12} md={8} lg={6} key={p._id}>
                    <PerformerGridCard performer={p} countries={countries} />
                  </Col>
                ))}
            </Row>
            {!total && !fetching && (
              <p className="text-center" style={{ margin: 20 }}>
                No profile was found
              </p>
            )}
            {fetching && (
              <div className="text-center" style={{ margin: 30 }}>
                <Spin />
              </div>
            )}
            {total && !fetching && total > limit ? (
              <Pagination
                className="text-center"
                showQuickJumper
                defaultCurrent={current}
                total={total}
                pageSize={limit}
                onChange={this.pageChanged}
                showSizeChanger={false}
                style={{ width: "100%" }}
              />
            ) : null}
          </Col>
        </Row>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  settings: { ...state.settings },
});

const mapDispatch = {};
Performers.authenticate = false;
export default connect(mapStates, mapDispatch)(Performers);
