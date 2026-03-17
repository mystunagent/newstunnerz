import { Carousel } from 'antd';
import { IPerformer, ICountry } from 'src/interfaces';
import { chunk } from 'lodash';
import PerformerCard from './card';
import './performer.less';

interface IProps {
  performers: IPerformer[];
  countries: ICountry[];
}

export default function HomePerformers({ performers, countries }:IProps) {
  const chunkPerformers = chunk(performers, 4);
  return (
    <div className="sug-content">
      <Carousel swipeToSlide arrows dots={false}>
        {chunkPerformers.length > 0 && chunkPerformers.map((arr: any, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`newaa_${index}`}>
            {arr.length > 0 && arr.map((p) => <PerformerCard countries={countries} performer={p} key={p._id} />)}
          </div>
        ))}
      </Carousel>
    </div>
  );
}
