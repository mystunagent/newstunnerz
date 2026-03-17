import { Divider } from 'antd';
import './bar-title-home.less';

type IProps = {
  title: string;
};

export default function BarTitleHome({ title }: IProps) {
  return (
    <div className="title-bar">
      <Divider>
        {title !== '' && (
        <strong>
          {title}
        </strong>
        )}
      </Divider>
    </div>
  );
}
