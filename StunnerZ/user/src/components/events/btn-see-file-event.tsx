import { Image } from 'antd';

type IProps = {
  data: any;
};

export default function BtnSeeFileEvent({ data }: IProps) {
  return (
    <div>
      <Image src={data.image?.img.path} alt={data.image?.img.path} width={200} />
    </div>
  );
}
