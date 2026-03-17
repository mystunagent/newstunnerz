import {
  DeleteOutlined,
  PlayCircleOutlined,
  LoadingOutlined, UploadOutlined
} from '@ant-design/icons';
import {
  Button, Progress, Upload
} from 'antd';

import './upload-paid-content.less';

interface IProps {
  thumbUrl: string;
  fileContent: any;
  uploadPercentage: number;
  uploading: boolean;
  canAddContent: boolean;
  beforeUpload: Function;
  handleRemove: Function;
}
export function UploadPaidContent({
  thumbUrl, fileContent, uploading, canAddContent, beforeUpload,
  handleRemove, uploadPercentage
}: IProps) {
  return (
    <>
      <div>
        {fileContent && (
        <div className="f-upload-content">
          <div className="f-upload-item" key={fileContent._id || fileContent.uid}>
            <>
              <div className="f-upload-thumb">
                {fileContent.type.includes('image')
                && (
                <img
                  alt="img"
                  src={thumbUrl}
                  className="f-thumb-photo"
                />
                )}
                {fileContent.type.includes('video')
                  && (
                  <span className="f-thumb-vid">
                    <PlayCircleOutlined />
                  </span>
                  )}
              </div>
              <span className="f-remove">
                <Button type="primary" onClick={() => handleRemove('removeFile')}>
                  <DeleteOutlined />
                </Button>
              </span>
            </>
          </div>
        </div>
        )}
        {canAddContent && (
        <Upload
          accept="image/*, video/*"
          showUploadList={false}
          multiple={false}
          disabled={uploading}
          beforeUpload={beforeUpload.bind(this)}
          className={!canAddContent && 'upload-paid-content'}
        >
          <Button loading={uploading} disabled={uploading} className="primary btn-primary btn-upload">
            Upload File
            {uploading ? <LoadingOutlined /> : <UploadOutlined />}
          </Button>
        </Upload>
        )}
        {uploadPercentage ? (
          <Progress percent={Math.round(uploadPercentage)} />
        ) : null}
      </div>
    </>
  );
}
