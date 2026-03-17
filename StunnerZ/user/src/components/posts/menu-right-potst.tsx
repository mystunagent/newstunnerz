import HomeFooter from '@components/common/layout/footer';
import './list-filter-post.less';
import HomePerformers from '@components/performer/home-listing';

type IProps = {
  countries: any;
  performers: any;
}

export default function MenuRightPostPerformer({ countries, performers }: IProps) {
  return (
    <div className="main-posts-filter">
      <HomePerformers countries={countries} performers={performers} />
      <div className="home-footer active">
        <HomeFooter customId="home-footer" />
      </div>
    </div>
  );
}
