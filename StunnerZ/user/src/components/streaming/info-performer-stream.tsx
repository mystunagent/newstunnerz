import {
  Layout, Card, Image, Descriptions
} from 'antd';
import './index.less';

type IProps = {
  user: any;
}
const { Meta } = Card;

export default function InfoPerformerStreaming({ user }: IProps) {
  return (
    <Layout>
      <div>
        <Card
          style={{ backgroundColor: '#f7f7f7' }}
          hoverable
          cover={<Image width={200} style={{ padding: '10px', borderRadius: '15px' }} preview={false} alt={user.avatar} src={user.avatar || '/static/no-avatar.png'} />}
        >
          <Descriptions column={1} title="Creator Info">
            <Descriptions.Item label="Name">{user.name || user.username}</Descriptions.Item>
            <Descriptions.Item label="Gender">{user.gender || ''}</Descriptions.Item>
            <Descriptions.Item label="Hair Color">{user.hair || ''}</Descriptions.Item>
            <Descriptions.Item label="Sexual Orientation">{user.sexualOrientation || ''}</Descriptions.Item>
            <Descriptions.Item label="Ethnicities">{user.ethnicity || ''}</Descriptions.Item>
            <Descriptions.Item label="Body Type">{user.bodyType || ''}</Descriptions.Item>
            <Descriptions.Item label="Butt">{user.butt || ''}</Descriptions.Item>
          </Descriptions>
          <Meta title="Bio" description={user.bio || ''} />
          {/* <br />
          <Descriptions column={1} title="Follow On">
            <Descriptions.Item label="Twitter">
              <a href={user.twitterUrl}>
                {user.twitterUrl || ''}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Instagram">
              <a href={user.instagramUrl}>
                {user.instagramUrl || ''}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Website">
              <a href={user.websiteUrl}>
                {user.websiteUrl || ''}
              </a>
            </Descriptions.Item>
          </Descriptions> */}
        </Card>
      </div>
    </Layout>
  );
}
