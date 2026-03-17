import { PureComponent } from 'react';
import {
  Upload, message, Button, Progress
} from 'antd';
import {
  UploadOutlined, LoadingOutlined
} from '@ant-design/icons';
import { getGlobalConfig } from '@services/config';
import { IPerformer } from '@interfaces/performer';

import './welcome-message-upload.less';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file) {
  const config = getGlobalConfig();
  if (file.type.includes('image')) {
    const isMaxSize = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5);
    if (!isMaxSize) {
      message.error(`Image must be smaller than ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB!`);
      return false;
    }
  }
  if (file.type.includes('video')) {
    const isMaxSize = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 5120);
    if (!isMaxSize) {
      message.error(`Video must be smaller than ${config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 5120}MB!`);
      return false;
    }
  }
  return true;
}

interface IProps {
  thumbnailUrl: string;
  uploadUrl: string;
  headers: any;
  performer: IPerformer;
}

interface IState {
  loading: boolean;
  imageUrl: string;
  typeFile: string;
  uploadPercent: number;
}

export class WelcomeMessageUpload extends PureComponent<IProps, IState> {
  state = {
    loading: false,
    imageUrl: '/static/thank-you.png',
    typeFile: 'photo',
    uploadPercent: 0
  };

  componentDidMount() {
    const { thumbnailUrl, performer } = this.props;
    if (thumbnailUrl) {
      this.setState({ imageUrl: thumbnailUrl });
    }
    if (performer?.welcomeMessageFileType) {
      this.setState({ typeFile: performer?.welcomeMessageFileType });
    }
  }

  componentDidUpdate(prevProps: any) {
    const { thumbnailUrl } = this.props;
    if (prevProps?.thumbnailUrl !== thumbnailUrl) {
      this.setState({
        imageUrl: thumbnailUrl
      });
    }
  }

  handleChange = (info) => {
    if (info.file.status === 'uploading') {
      this.setState({
        loading: true,
        uploadPercent: info?.file?.percent || 0
      });
      this.forceUpdate();
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj, (imageUrl) => {
        if (info.file.type.includes('image')) {
          this.setState({
            imageUrl,
            loading: false,
            typeFile: 'photo'
          });
        }
        if (info.file.type.includes('video')) {
          this.setState({
            imageUrl: info.file.response.data.url,
            loading: false,
            typeFile: 'video'
          });
        }
        message.success('Changes saved');
      });
    }
  };

  onPreview = async (file) => {
    let src = file.url;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow.document.write(image.outerHTML);
  };

  render() {
    const { loading } = this.state;
    const { imageUrl, typeFile, uploadPercent } = this.state;
    const { headers, uploadUrl } = this.props;
    return (
      <div className="upload-container">
        <Upload
          accept="photo/*, video/8"
          name="welcome-message"
          showUploadList={false}
          action={uploadUrl}
          beforeUpload={beforeUpload}
          onChange={this.handleChange}
          onPreview={this.onPreview}
          headers={headers}
        >
          <Button disabled={loading} className="primary btn-primary btn-upload">
            Upload File
            {loading ? <LoadingOutlined /> : <UploadOutlined />}
          </Button>
        </Upload>
        {typeFile === 'photo' && (
        <img
          src={imageUrl}
          alt="welcome-message"
          className="photo-item"
        />
        )}
        {typeFile === 'video' && (
        <video
          muted={false}
          className="video-item"
          controls
          src={imageUrl}
        />
        )}
        {uploadPercent
        && (
        <div className="progress">
          <Progress percent={Math.round(uploadPercent)} />
        </div>
        )}
      </div>
    );
  }
}
