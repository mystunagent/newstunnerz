/* eslint-disable no-template-curly-in-string */
import { PureComponent } from 'react';
import {
  Form, Input, Row, Col, Select, Upload, Progress, message, Checkbox, Divider, Modal
} from 'antd';
import { ICountry, IBody } from 'src/interfaces';
import { AvatarUpload } from '@components/user/avatar-upload';
import { CoverUpload } from '@components/user/cover-upload';
import { UploadOutlined } from '@ant-design/icons';
import { getGlobalConfig } from '@services/config';
import { VideoPlayer } from '@components/common';
import { omit } from 'lodash';
import { FormInstance } from 'antd/lib/form';
// import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';

const { Option } = Select;

const { TextArea } = Input;

interface IProps {
  options?: {
    uploadHeaders?: any;
    avatarUploadUrl?: string;
    onAvatarUploaded?: Function;
    coverUploadUrl?: string;
    onCoverUploaded?: Function;
    beforeUpload?: Function;
    videoUploadUrl?: string;
    onVideoUploaded?: Function;
    uploadPercentage?: number;
  };
  countries: ICountry[];
  bodyInfo: IBody;
  onFinish: Function;
  formRef: any;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!',
  types: {
    email: 'Not a validate email!',
    number: 'Not a validate number!'
  },
  number: {
    // eslint-disable-next-line no-template-curly-in-string
    range: 'Must be between ${min} and ${max}'
  }
};

export default class BasicInfoRegister extends PureComponent<IProps> {
  state = {
    uploadVideoPercentage: 0,
    previewVideoUrl: null,
    previewVideoName: null,
    isShowPreview: false,
    coverUrl: "url('/static/banner-image.jpg')"
  };

  handleVideoChange = (info: any) => {
    info.file && info.file.percent && this.setState({ uploadVideoPercentage: info.file.percent });
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      message.success('Intro video was uploaded');
      this.setState({
        previewVideoUrl: info?.file?.response?.data.url,
        previewVideoName: info?.file?.response?.data.name
      });
      this.setFormVal('welcomeVideoId', info?.file?.response.data._id);
    }
  };

  setFormVal(field: string, val: any) {
    const { formRef } = this.props;
    const instance = formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  }

  beforeUploadVideo = (file) => {
    const isValid = file.size / 1024 / 1024 < (getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_TEASER || 200);
    if (!isValid) {
      message.error(`File is too large please provide an file ${getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_TEASER || 200}MB or below`);
      return false;
    }
    this.setState({ previewVideoName: file.name });
    return true;
  };

  render() {
    const {
      countries, options, bodyInfo, onFinish, formRef
    } = this.props;

    const {
      genders = []
      // , sexualOrientations = []
    } = bodyInfo;
    const {
      uploadHeaders,
      avatarUploadUrl,
      coverUploadUrl,
      videoUploadUrl
    } = options;
    const {
      uploadVideoPercentage, previewVideoUrl, previewVideoName, isShowPreview, coverUrl
    } = this.state;
    return (
      <Form
        ref={formRef}
        {...layout}
        name="nest-messages"
        onFinish={(val) => onFinish(omit(val, ['confirmPassword', 'confirmEmail']))}
        validateMessages={validateMessages}
        initialValues={{} as any} // todo should add interface
        scrollToFirstError
        className="account-form"
      >
        <div className="top-profile" style={{ backgroundImage: coverUrl }}>
          <div className="avatar-upload">
            <AvatarUpload
              headers={uploadHeaders}
              uploadUrl={avatarUploadUrl}
              onUploaded={({ response }) => this.setFormVal('avatarId', response.data._id)}
            />
          </div>
          <div className="avatar-alert">
            <span style={{ color: '#f04134' }}>Strictly NO NUDE Photo profile</span>
          </div>
          <div className="cover-upload">
            <CoverUpload
              headers={uploadHeaders}
              uploadUrl={coverUploadUrl}
              onUploaded={(data) => {
                data?.base64 && this.setState({ coverUrl: `url(${data.base64})` });
                // onCoverUploaded(data);
                this.setFormVal('coverId', data.response.data._id);
              }}
              options={{ fieldName: 'cover' }}
            />
          </div>
          <div style={{ position: 'absolute', right: 0, bottom: -25 }}>
            <span style={{ color: '#f04134' }}>Strictly NO NUDE Banners</span>
          </div>
        </div>
        <Form.Item noStyle name="avatarId">
          <Input type="hidden" />
        </Form.Item>
        <Form.Item noStyle name="coverId">
          <Input type="hidden" />
        </Form.Item>
        <Form.Item noStyle name="welcomeVideoId">
          <Input type="hidden" />
        </Form.Item>
        <Row>
          <Col xs={24}>
            <h1><b>Account Details</b></h1>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="username"
              label="Username"
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                {
                  pattern: new RegExp(/^[a-z0-9]+$/g),
                  message:
                    'Username must contain lowercase alphanumerics only'
                },
                { min: 3, message: 'Username must containt at least 3 characters' }
              ]}
            >
              <Input placeholder="user1, john99,..." />
            </Form.Item>
          </Col>
          {/* <Col xs={24} md={12}>
            <Form.Item name="referrerId" label="Referred By">
              <SelectPerformerDropdown onSelect={(performerId) => this.setFormVal('referrerId', performerId)} showAll={false} noAuthApi />
            </Form.Item>
          </Col> */}
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="email"
              label="Email Address"
              rules={[{ type: 'email' }, { required: true, message: 'Please input your email address!' }]}
              hasFeedback
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input placeholder="Email address" />
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item
              label="Confirm Email Address"
              name="confirmEmail"
              dependencies={['email']}
              hasFeedback
              rules={[
                { type: 'email' },
                {
                  required: true,
                  message: 'Please confirm your email address!'
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (!value || getFieldValue('email') === value) {
                      return Promise.resolve();
                    }
                    // eslint-disable-next-line prefer-promise-reject-errors
                    return Promise.reject('Emails do not match together!');
                  }
                })
              ]}
            >
              <Input placeholder="Confirm email address" />
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item
              label="Password"
              name="password"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: 'Please enter your password!'
                },
                {
                  pattern: new RegExp(/^(?=.{8,})(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])(?=.*[^\w\d]).*$/g),
                  message: 'Password must have minimum 8 characters, at least 1 number, 1 uppercase letter, 1 lowercase letter & 1 special character'
                }
              ]}
            >
              <Input.Password placeholder="New password" />
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item
              label="Confirm new Password"
              name="confirmPassword"
              dependencies={['password']}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: 'Please confirm your password!'
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    // eslint-disable-next-line prefer-promise-reject-errors
                    return Promise.reject('Passwords do not match together!');
                  }
                })
              ]}
            >
              <Input.Password placeholder="Confirm new password" />
            </Form.Item>
          </Col>
          <Divider />
          <Col xs={24}>
            <h1><b>Public Profile Setup</b></h1>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="name"
              label="Display name"
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                {
                  required: true,
                  message: 'Please enter your display name!'
                },
                {
                  pattern: new RegExp(/^(?=.*\S).+$/g),
                  message:
                    'Display name can not contain only whitespace'
                },
                {
                  min: 3,
                  message: 'Display name must containt at least 3 characters'
                }
              ]}
              hasFeedback
            >
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="gender" label="Gender">
              <Select>
                {genders.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="sentence"
              label="Sentence"
              rules={[
                {
                  max: 30,
                  message: 'Sentence maximum length is 30 characters'
                }
              ]}
            >
              <TextArea />
            </Form.Item>
          </Col>
          {/* <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="sexualOrientation"
              label="Sexual orientation"
            >
              <Select>
                {sexualOrientations.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col> */}
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="country" label="Country">
              <Select
                showSearch
                optionFilterProp="label"
              >
                {countries.map((c) => (
                  <Option value={c.code} label={c.name} key={c.code}>
                    <img alt="country_flag" src={c.flag} width="25px" />
                    {' '}
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="bio" label="Bio">
              <TextArea rows={3} placeholder="Tell people something about you..." />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="twitterUrl"
              label="Twitter"
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                {
                  pattern: new RegExp(/(((https?:\/\/)|(www\.))[^\s]+)/g),
                  message:
                    'Twitter must be a link'
                }
              ]}
            >
              <Input placeholder="https://twitter.com/yourname" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="instagramUrl"
              label="Instagram"
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                {
                  pattern: new RegExp(/(((https?:\/\/)|(www\.))[^\s]+)/g),
                  message:
                    'Instagram must be a link'
                }
              ]}
            >
              <Input placeholder="https://instagram.com/yourname" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="websiteUrl"
              label="Website"
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                {
                  pattern: new RegExp(/(((https?:\/\/)|(www\.))[^\s]+)/g),
                  message:
                    'Website must be a link'
                }
              ]}
            >
              <Input placeholder="https://yourwebsite" />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item label={(
              <>
                Intro Video
                <span style={{ color: '#f04134', marginLeft: 10 }}>Strictly NO Nude, No Porn video</span>
              </>
            )}
            >
              <Upload
                accept={'video/*'}
                name="welcome-video"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                action={videoUploadUrl}
                headers={uploadHeaders}
                beforeUpload={(file) => this.beforeUploadVideo(file)}
                onChange={this.handleVideoChange.bind(this)}
              >
                <UploadOutlined />
              </Upload>
              <div className="ant-form-item-explain" style={{ textAlign: 'left' }}>
                {((previewVideoUrl || previewVideoName) && <a aria-hidden onClick={() => this.setState({ isShowPreview: true })}>{previewVideoName || previewVideoUrl || 'Click here to preview'}</a>)
                  || (
                    <a>
                      Intro video is
                      {' '}
                      {getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_TEASER || 200}
                      MB or below
                    </a>
                  )}
              </div>
              {uploadVideoPercentage ? (
                <Progress percent={Math.round(uploadVideoPercentage)} />
              ) : null}
            </Form.Item>
            <Form.Item name="activateWelcomeVideo" valuePropName="checked">
              <Checkbox>Activate intro video</Checkbox>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <div
              style={{
                border: '1px solid green',
                fontStyle: 'italic',
                padding: '5px 10px 0',
                borderRadius: 8
              }}
            >
              <p>In order to complete your account registration, please make sure you complete the below points</p>
              <ol>
                <li style={{ listStyleType: 'num' }}>
                  Complete the banking information and input all the fields.
                </li>
                <li style={{ listStyleType: 'num' }}>
                  Check and select all 4 checkboxes
                </li>
                <li style={{ listStyleType: 'num' }}>
                  Click on Verify ID
                </li>
              </ol>
            </div>
          </Col>
        </Row>

        <Modal
          width={767}
          footer={null}
          onOk={() => this.setState({ isShowPreview: false })}
          onCancel={() => this.setState({ isShowPreview: false })}
          visible={isShowPreview}
          destroyOnClose
          centered
        >
          <VideoPlayer
            {...{
              autoplay: true,
              controls: true,
              playsinline: true,
              fluid: true,
              sources: [
                {
                  src: previewVideoUrl,
                  type: 'video/mp4'
                }
              ]
            }}
          />
        </Modal>
      </Form>
    );
  }
}
