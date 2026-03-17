import {
  useRef, useState
} from 'react';
import {
  Form, Input, Button, Row, Col,
  message, Popover
} from 'antd';
import {
  IPerformer
} from 'src/interfaces';

import {
  SmileOutlined
} from '@ant-design/icons';
import { getGlobalConfig } from '@services/config';

import { Emotions } from '@components/messages/emotions';

import {
  updatePerformer
} from 'src/redux/user/actions';
import { useDispatch } from 'react-redux';
import { WelcomeMessageUpload } from '@components/user/welcome-message-upload';
import { authService } from '@services/auth.service';
import { performerService } from '@services/performer.service';

import './welcome-message-form.less';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const { TextArea } = Input;

const validateMessages = {
  required: 'This field is required!'
};

const templateWelcomeMessage = `Welcome baby thank you for subscribing Here you can see private pics/vids that are not allowed on Social Media and you can chat to me exclusively!! I'll always reply you

Get access to all o my unseen & exclusive X-rated content right here including - my naughtiest wildest fantasises based on all real life stories while exploring my life`;

interface IProps {
  performer: IPerformer;
}

function WelcomeMessageForm({
  performer
}: IProps) {
  const formRef = useRef();
  const [text, setText] = useState(performer?.welcomeMessageText || templateWelcomeMessage);
  const [uploading, setUploading] = useState(false);
  const dispatch = useDispatch();

  const onEmojiClick = (emoji) => {
    setText(`${text} ${emoji} `);
  };
  const submit = async () => {
    setUploading(true);
    if (!text.length) {
      message.error('Please add content');
      setUploading(false);
    } else {
      const data = {
        ...performer,
        welcomeMessageText: text
      };
      dispatch(updatePerformer(data));
      setUploading(false);
    }
  };
  const uploadHeaders = {
    authorization: authService.getToken()
  };
  return (
    <Form
      ref={formRef}
      {...layout}
      name="nest-messages"
      onFinish={submit}
      validateMessages={validateMessages}
      className="form-welcome-message"
    >
      <Row>
        <Col xs={24}>
          <h1><b>Welcome Message</b></h1>
        </Col>
        <Col lg={24} md={24} xs={24}>
          <Form.Item
            label="Welcome message content"
            validateTrigger={['onChange', 'onBlur']}
            extra="When a user follow/subscribe to you, a welcome message automatically sent to user inbox"
          >
            <div className="input-f-desc">
              <TextArea
                showCount
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="feed-input"
                rows={6}
                maxLength={100}
                placeholder={text}
                allowClear
                disabled={uploading}
              />
              <Popover
                className="emotion-popover"
                content={<Emotions onEmojiClick={onEmojiClick.bind(this)} />}
                title={null}
                trigger="click"
              >
                <span className="grp-emotions">
                  <SmileOutlined />
                </span>
              </Popover>
            </div>
          </Form.Item>
        </Col>
        <Col lg={24} md={24} xs={24}>
          <Form.Item label="Welcome message file">
            <div className="avatar-upload">
              <WelcomeMessageUpload
                performer={performer}
                headers={uploadHeaders}
                uploadUrl={performerService.getWelcomeMessageUploadUrl()}
                thumbnailUrl={performer?.welcomeMessagePath || '/static/thank-you.jpg'}
              />
            </div>
            <div className="ant-form-item-explain form-expalin">
              <a>
                Photo must be smaller than
                {' '}
                {getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}
                MB or
                Video must be smaller than
                {' '}
                {getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_VIDEO || 5120}
                MB
              </a>
            </div>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
        <Button
          className="primary"
          type="primary"
          htmlType="submit"
          loading={uploading}
          disabled={uploading}
        >
          Save Changes
        </Button>
      </Form.Item>
    </Form>
  );
}

export default WelcomeMessageForm;
