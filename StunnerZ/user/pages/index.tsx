import {
  Layout
} from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import BannerComponent from '@components/common/banner';
import {
  performerService, bannerService, utilsService, streamService
} from '@services/index';
import {
  IPerformer, ISettings, IBanner, IUIConfig, ICountry, IStream
} from 'src/interfaces';
import './index.less';
import SearchModelStream from '@components/search/search-model-stream';
import SearchModelFollow from '@components/search/search-model-follow';
import HomeLatestFeeds from '@components/search/search-model-post';
import Router from 'next/router';

interface IProps {
  countries: ICountry[];
  banners: IBanner[];
  streams: IStream[];
  ui: IUIConfig;
  settings: ISettings;
  user: any;
  performers: IPerformer[];
  getFeeds: Function;
  moreFeeds: Function;
  feedState: any;
  removeFeedSuccess: Function;
}

class HomePage extends PureComponent<IProps> {
  static authenticate = false;

  static noredirect = false;

  static async getInitialProps() {
    const [banners, countries, streams] = await Promise.all([
      bannerService.search({ limit: 99 }),
      utilsService.countriesList(),
      streamService.search({ limit: 99 })
    ]);
    return {
      banners: banners?.data?.data || [],
      countries: countries?.data || [],
      streams: streams?.data?.data || []
    };
  }

  state = {
    loadingPerformer: false,
    isFreeSubscription: '',
    randomPerformers: []
  }

  componentDidMount() {
    const { user } = this.props;
    if (user?.infoSubPerformer?._id && (!user?.infoSubPerformer?.privilege.includes('all'))) {
      Router.push('/');
      return;
    }
    this.getPerformers();
  }

  async getPerformers() {
    const { isFreeSubscription } = this.state;
    const { user } = this.props;
    try {
      await this.setState({ loadingPerformer: true });
      const performers = await (
        await performerService.randomSearch({ isFreeSubscription, limit: 6, offset: 0 })
      ).data.data;
      this.setState({
        randomPerformers: performers.filter((p) => p._id !== user._id),
        loadingPerformer: false
      });
    } catch {
      this.setState({ loadingPerformer: false });
    }
  }

  render() {
    const {
      ui, user, banners, settings
    } = this.props;
    const topBanners = banners && banners.length > 0 && banners.filter((b) => b.position === 'homePageTop');
    const topBannersLive = banners && banners.length > 0 && banners.filter((b) => b.position === 'homeLiveStreaming');
    const topBannersFollow = banners && banners.length > 0 && banners.filter((b) => b.position === 'homeCreator');
    const {
      randomPerformers, loadingPerformer
    } = this.state;
    return (
      <Layout>
        <>
          <Head>
            <title>
              {ui && ui.siteName}
              {' '}
              | Home
            </title>
          </Head>
          <div className="home-page">
            <BannerComponent settings={settings?.speedBanner} banners={topBanners} width={453.5} />
            <div>
              <SearchModelStream settings={settings?.speedBanner} topBanners={topBannersLive} user={user} />
            </div>
            <div>
              <SearchModelFollow settings={settings?.speedBanner} topBanners={topBannersFollow} user={user} randomPerformers={randomPerformers} loading={loadingPerformer} />
            </div>
            <div>
              <HomeLatestFeeds user={user} />
            </div>
          </div>
        </>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  user: { ...state.user.current },
  settings: { ...state.settings }
});

export default connect(mapStates)(HomePage);
