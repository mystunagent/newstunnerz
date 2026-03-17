import {
  Button, Form, message, InputNumber, Switch
} from 'antd';
import {
  useRef, useState
} from 'react';
import TextArea from 'antd/lib/input/TextArea';
import { getGlobalConfig } from '@services/config';
import {
  messageService
} from '@services/index';
import { sendPaidContentMessageSuccess } from '@redux/message/actions';
import { connect } from 'react-redux';
import { UploadPaidContent } from '@components/file/upload-paid-content';

import './PaidContentForm.less';

interface IProps {
  conversation: any;
  sendContentSuccess: Function;
  sendPaidContentMessageSuccess: Function;
}

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

const mapStatesToProps = (state: any) => ({
  ui: { ...state.ui }
});

const mapDispatch = { sendPaidContentMessageSuccess };

const connector = connect(mapStatesToProps, mapDispatch);

function PaidContentForm({
  conversation,
  sendContentSuccess,
  sendPaidContentMessageSuccess: handleSendPaidContentMessageSuccess
}: IProps) {
  const [uploading, setUploading] = useState(false);
  const [isSale, setIsSale] = useState(false);

  const [canAddContent, setCanAddContent] = useState(true);
  const [fileContent, setFileContent] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [uploadPercentage, setUploadPercentage] = useState(0);

  const formRef = useRef(null);

  const handleResetFields = (type: string) => {
    if (type === 'resetFields') {
      formRef.current?.resetFields();
    }
    setCanAddContent(true);
    setFileContent(null);
    setThumbUrl(null);
  };

  const onUploading = (resp) => {
    setUploading(true);
    setUploadPercentage(resp.percentage);
  };

  const beforeUpload = (file) => {
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
    if (file) {
      setCanAddContent(false);
      setFileContent(file);
      setThumbUrl(false);
    }
    getBase64(file, (imageUrl) => {
      setThumbUrl(imageUrl);
    });
    return true;
  };

  const submit = async (formValues: any) => {
    const payload = { ...formValues };
    if (!fileContent) {
      message.error('Please add a photo/video!');
      return;
    }
    if (!payload.text.trim()) {
      message.error('Please add a description');
      return;
    }
    if (isSale && !(payload.price > 0)) {
      message.error('Price must be greater than 0');
      return;
    }
    try {
      setUploading(true);
      const resp = isSale ? await messageService.paidContentMessage(
        conversation._id,
        fileContent,
        payload,
        onUploading.bind(this)
      ) : await messageService.freeContentMessage(
        conversation._id,
        fileContent,
        payload,
        onUploading.bind(this)
      )as any;
      handleSendPaidContentMessageSuccess({
        conversationId: conversation._id,
        content: resp.data
      });
      sendContentSuccess();
      handleResetFields('resetFields');
      message.success('Content sent successfully');
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'An error occurred, please try again!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form
      ref={formRef}
      labelCol={{ span: 24 }}
      wrapperCol={{ span: 24 }}
      className={`paid-content-form ${uploading && 'submit'}`}
      initialValues={
          {
            text: '', price: 9.99
          }
        }
      onFinish={(values) => {
        submit(values);
      }}
    >
      <h3>Add Content</h3>
      <Form.Item
        name="text"
        validateTrigger={['onChange', 'onBlur']}
        rules={[{ required: true, message: 'Please add the messages' }]}
        label="Messages"
      >
        <TextArea
          showCount
          rows={3}
          placeholder="Write your message here"
          allowClear
        />
      </Form.Item>
      <Form.Item>
        <Switch checkedChildren="Paid Content" unCheckedChildren="Free Content" checked={isSale} onChange={() => setIsSale(!isSale)} />
      </Form.Item>
      {isSale && (
      <Form.Item label="Price" name="price">
        <InputNumber />
      </Form.Item>
      )}
      <Form.Item label="Add photo/video">
        <UploadPaidContent
          thumbUrl={thumbUrl}
          fileContent={fileContent}
          uploading={uploading}
          canAddContent={canAddContent}
          beforeUpload={beforeUpload.bind(this)}
          handleRemove={handleResetFields.bind(this)}
          uploadPercentage={uploadPercentage}
        />
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
      <Button className="btn-send-bulk" type="primary" disabled={uploading} loading={uploading} htmlType="submit">SEND</Button>
    </Form>
  );
}

export default connector(PaidContentForm);
