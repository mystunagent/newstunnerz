import { formatDateNotSecond } from '@lib/date';
import { Descriptions, Image, Layout } from 'antd';
import moment from 'moment';

type IProps = {
  performer: any;
}

export default function InformationLivePerformer({ performer }: IProps) {
  const countAge = moment(performer.dateOfBirth).diff(moment(), 'years');
  return (
    <Layout>
      <Descriptions>
        <Descriptions.Item>
          <Image src={performer.avatar} width={250} />
        </Descriptions.Item>
        <br />
        <Descriptions.Item label="Username">{performer.username}</Descriptions.Item>
        <Descriptions.Item label="Gender">{performer.gender}</Descriptions.Item>
        <Descriptions.Item label="Member Since">{performer.createdAt}</Descriptions.Item>
        <Descriptions.Item label="last Broadcast">{formatDateNotSecond(performer.lastStreamingTime)}</Descriptions.Item>
        <Descriptions.Item label="Ethnicity">{performer.city}</Descriptions.Item>
        <Descriptions.Item label="Age">{Number(countAge)}</Descriptions.Item>
        <Descriptions.Item label="Date of Birth">{performer.dateOfBirth}</Descriptions.Item>
        <Descriptions.Item label="Country">{performer.country}</Descriptions.Item>
        <Descriptions.Item label="Height">{performer.height}</Descriptions.Item>
        <Descriptions.Item label="Weight">{performer.weight}</Descriptions.Item>
        <Descriptions.Item label="Eyes">{performer.eyes}</Descriptions.Item>
      </Descriptions>
    </Layout>
  );
}
