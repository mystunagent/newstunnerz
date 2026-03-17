import { Upload, message } from 'antd';
import { LoadingOutlined, CameraOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { getGlobalConfig } from '@services/config';
import { isVideo } from '@lib/string';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file) {
  const config = getGlobalConfig();
  const isMaxSize = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5);
  if (!isMaxSize) {
    message.error(`Image must smaller than ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB!`);
    return false;
  }
  return true;
}

function beforeUploadVideo(file) {
  const config = getGlobalConfig();
  const isMaxSize = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200);

  if (!isMaxSize) {
    message.error(
      `File must smaller than ${config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200}MB!`
    );
    return false;
  }
  return true;
}

interface IProps {
  image?: string;
  uploadUrl: string;
  headers?: any;
  onUploaded: Function;
  options?: any;
  accept?: string;
}

export function ImageUpload({
  image,
  uploadUrl,
  headers,
  onUploaded,
  options,
  accept
}: IProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj, (url) => {
        setLoading(false);
        setImageUrl(url);
        onUploaded
          && onUploaded({
            response: info.file.response,
            base64: imageUrl
          });
      });
    }
  };

  return (
    <Upload
      accept={accept}
      name={options?.fieldName || 'file'}
      listType="picture-card"
      className="avatar-uploader"
      showUploadList={false}
      action={uploadUrl}
      beforeUpload={accept.includes('video') ? beforeUploadVideo : beforeUpload}
      onChange={handleChange.bind(this)}
      headers={headers}
    >
      {(imageUrl || image) && !isVideo(imageUrl || image) && <img src={imageUrl || image} alt="file" style={{ width: '100%' }} />}
      {(imageUrl || image) && isVideo(imageUrl || image) && <video src={imageUrl || image} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />}

      {loading ? <LoadingOutlined /> : <CameraOutlined />}
    </Upload>
  );
}

ImageUpload.defaultProps = {
  image: '',
  headers: null,
  options: null,
  accept: 'image/*'
};
