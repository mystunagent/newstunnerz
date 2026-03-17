/* eslint-disable no-param-reassign */
import {
  useState, useRef
} from 'react';
import {
  message, Button, Select,
  Input, Form
} from 'antd';
import {
  messageService
} from '@services/index';
import { getGlobalConfig } from '@services/config';
import MassMessageUpload from '@components/file/mass-message-upload';

const { TextArea } = Input;
const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!'
};

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function MassMessageCreate() {
  const [recipients, setRecipients] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [fileMassMessage, setFileMassMessage] = useState(null);
  const formRef = useRef(null);

  const onUploading = (file, resp: any) => {
    setUploadPercentage(resp.percentage);
    if (resp.percentage === 100) {
      file.status = 'done';
    }
  };

  const remove = async (file) => {
    try {
      await messageService.deleteMassMessageFile(file?._id);
      setFileMassMessage(null);
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Error occured please try again!');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const beforeUpload = async (file, listFile) => {
    const config = getGlobalConfig();
    if (file.type.includes('image')) {
      const valid = (file.size / 1024 / 1024) < (config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5);
      if (!valid) {
        message.error(`Image ${file.name} must be smaller than ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB!`);
        return false;
      }
    }
    if (file.type.includes('video')) {
      const valid = (file.size / 1024 / 1024) < (config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 5000);
      if (!valid) {
        message.error(`Video ${file.name} must be smaller than ${config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 5000}MB!`);
        return false;
      }
    }
    // eslint-disable-next-line no-constant-condition, no-cond-assign
    if (file.status = 'done') {
      getBase64(file, (imageUrl) => {
        file.thumbnail = imageUrl;
      });
    }
    try {
      setUploading(true);
      const resp = await messageService.uploadMassMessageFile(
        file,
        {},
        onUploading.bind(this, file)
      ) as any;
      file.url = resp.data.url;
      file._id = resp.data._id;
      setFileMassMessage(file);
    } catch (e) {
      message.error(`File ${file.name} error!`);
    } finally {
      setUploading(false);
    }

    return true;
  };

  const sendMassMessage = async (payload) => {
    try {
      setUploading(true);
      await messageService.create(payload);
      formRef.current?.resetFields();
      setFileMassMessage(null);
      message.success(`Send mass message to ${payload?.recipients} successfully`);
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Something went wrong, please try again later');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (payload: any) => {
    const formValues = { ...payload };
    if (!formValues.text || !formValues.text.trim()) {
      return message.error('Please add a message');
    }
    if (fileMassMessage && fileMassMessage._id) {
      formValues.fileId = fileMassMessage._id;
    }
    sendMassMessage(formValues);
    return false;
  };

  return (
    <div className="feed-form">
      <Form
        {...layout}
        ref={formRef}
        onFinish={(values) => {
          submit(values);
        }}
        validateMessages={validateMessages}
        initialValues={{
          recipients: 'all',
          text: null
        }}
      >
        <Form.Item name="recipients" label="Select multiple recipients" rules={[{ required: true }]}>
          <Select value={recipients} onChange={(val) => setRecipients(val)}>
            <Select.Option value="all">All</Select.Option>
            <Select.Option value="user">All Users</Select.Option>
            <Select.Option value="performer">All Models</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Add message" name="text" rules={[{ required: true, message: 'Please add a message' }]}>
          <TextArea className="feed-input" rows={3} placeholder="Add a message..." allowClear />
        </Form.Item>
        <Form.Item label="Add File">
          <MassMessageUpload
            fileMassMessage={fileMassMessage}
            remove={remove.bind(this)}
            beforeUpload={beforeUpload.bind(this)}
            uploading={uploading}
            uploadPercentage={uploadPercentage}
          />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 4 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={uploading}
            disabled={uploading}
          >
            SEND
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default MassMessageCreate;
