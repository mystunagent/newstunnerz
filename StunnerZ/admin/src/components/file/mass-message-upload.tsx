import { useEffect, useState } from 'react';
import {
  DeleteOutlined,
  LoadingOutlined, UploadOutlined
} from '@ant-design/icons';
import {
  Progress, Button, Upload, Tooltip, Image
} from 'antd';
import { VideoPlayer } from '@components/common';

import './mass-message-upload.less';

interface IProps {
  remove: Function;
  beforeUpload: Function;
  fileMassMessage: any;
  uploading: boolean;
  uploadPercentage: number;
}
export default function MassMessageUpload({
  remove: handleRemove,
  beforeUpload: handleBeforeUpload,
  fileMassMessage,
  uploading,
  uploadPercentage
}: IProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState(fileMassMessage?.url);
  useEffect(() => {
    setThumbnailUrl(fileMassMessage?.url);
  }, [fileMassMessage?.url]);

  return (
    <div className="mass-message-upload-container">
      {fileMassMessage && (
        <div className="mass-message-upload-item" key={fileMassMessage?._id || fileMassMessage?.uid}>
          <div className="mass-message-upload-thumb">
            {fileMassMessage?.type?.includes('image')
              && <a><Image alt="" src={thumbnailUrl} width="100%" /></a>}
            {fileMassMessage?.type?.includes('video') && (
              <a className="video-thumb">
                {thumbnailUrl
                  && (
                    <VideoPlayer
                      {...{
                        autoplay: false,
                        controls: true,
                        playsinline: true,
                        fluid: true,
                        sources: [
                          {
                            src: thumbnailUrl,
                            type: 'video/mp4'
                          }
                        ]
                      }}
                    />
                  )}
              </a>
            )}
          </div>
          <div className="mass-message-upload-name">
            <Tooltip title={fileMassMessage?.name}>{fileMassMessage?.name}</Tooltip>
          </div>
          <div className="mass-message-upload-size">
            {(fileMassMessage?.size / (1024 * 1024)).toFixed(2)}
            {' '}
            MB
          </div>
          {fileMassMessage?.status !== 'uploading'
            && (
              <span className="mass-message-remove">
                <Button type="primary" onClick={handleRemove.bind(this, fileMassMessage)}>
                  <DeleteOutlined />
                </Button>
              </span>
            )}
          <div className="mass-message-progess">
            {uploadPercentage && <Progress percent={Math.round(uploadPercentage)} />}
          </div>
        </div>
      )}
      {(!fileMassMessage) && (
        <div className="upload-container">
          <Upload
            customRequest={() => true}
            accept={'video/*, image/*'}
            beforeUpload={handleBeforeUpload.bind(this)}
            multiple={false}
            showUploadList={false}
            disabled={uploading}
            listType="picture"
          >
            <Button loading={uploading} disabled={uploading} className="primary btn-primary btn-upload">
              Upload File
              {uploading ? <LoadingOutlined /> : <UploadOutlined />}
            </Button>
          </Upload>
        </div>
      )}

    </div>

  );
}
