import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Upload
} from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import moment from 'moment';
import { useRef, useState } from 'react';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { RcFile } from 'antd/lib/upload';
import { UploadFile, UploadProps } from 'antd/lib/upload/interface';
import { SelectMultiPerformerDropdown } from '@components/performer/common/select-multi-performer-dropdown';

type IProps = {
  onFinish: Function;
  // eslint-disable-next-line react/require-default-props
  event?: any;
  loading: boolean;
};

const { RangePicker } = DatePicker;

const getBase64 = (file: RcFile): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = (error) => reject(error);
});

export default function FormEvent({ onFinish, event, loading }: IProps) {
  const ref = useRef<Record<string, any>>();
  const fileListRef = useRef<any>(null);
  const [isPrivate, setIsPrivate] = useState();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [performerIds, setPerformerIds] = useState([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setFormVal = (field: string, val: any) => {
    setPerformerIds(val);
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      // eslint-disable-next-line no-param-reassign
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1)
    );
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => setFileList(newFileList);
  const handleCancel = () => setPreviewOpen(false);

  const remove = (file: any): boolean => {
    const index = fileListRef.current.findIndex((f) => f.uid === file.uid);
    if (index > -1) {
      fileListRef.current.splice(index, 1);
    }

    return true;
  };

  const beforeUpload = async (file: any) => {
    fileListRef.current.push(file);
    return false;
  };

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (
    <>
      <Form
        ref={ref as any}
        onFinish={(e) => onFinish({
          ...e,
          // fileIds: fileListRef.current?.fileIds,
          performerIds
        })}
        initialValues={
          event || {
            name: '',
            email: '',
            mobile: '',
            info: '',
            address: '',
            hosted: '',
            price: 0,
            availability: 0,
            status: 'active',
            isPrivate: false
          }
        }
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
      >
        <Form.Item
          name="name"
          rules={[{ required: true, message: 'Please input name of event!' }]}
          label="Event Name"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="date"
          rules={[{ required: !event, message: 'Please choose date!' }]}
          label="Date?"
        >
          <RangePicker
            defaultValue={
              event ? [moment(event?.startAt), moment(event?.endAt)] : null
            }
            showTime={{ format: 'HH:mm' }}
            format="DD-MM-YYYY HH:mm"
            disabledDate={(currentDate) => currentDate && currentDate < moment()}
          />
        </Form.Item>
        <Form.Item name="price" label="Event price">
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item
          name="address"
          rules={[
            { required: true, message: 'Please input address of event!' }
          ]}
          label="Location Address"
        >
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input email!' }]}
          label="Email"
        >
          <Input />
        </Form.Item>
        <Form.Item name="mobile" label="Mobile">
          <Input />
        </Form.Item>
        <Form.Item
          name="hosted"
          rules={[{ required: true, message: 'Please input hosted!' }]}
          label="Hosted"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="availability"
          rules={[{ required: true, message: 'Please input availability!' }]}
          label="Availability"
        >
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item name="info" label="Info">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item
          name="isPrivate"
          rules={[{ required: true, message: 'Please setup private!' }]}
          label="For Private?"
        >
          <Switch
            defaultChecked={event?.isPrivate || false}
            checked={isPrivate}
            onChange={(val: any) => setIsPrivate(val)}
          />
        </Form.Item>
        <Form.Item
          name="performerId"
          label="Model"
        >
          <SelectMultiPerformerDropdown
            showAll
            defaultValue={event && event?.performerId}
            onSelect={(val) => setFormVal('performerIds', val)}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select status!' }]}
        >
          <Select>
            <Select.Option key="active" value="active">
              Active
            </Select.Option>
            <Select.Option key="inactive" value="inactive">
              Inactive
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Upload photo/video">
          <Upload
            ref={fileListRef}
            customRequest={() => true}
            accept="image/*,video/*"
            beforeUpload={beforeUpload.bind(this)}
            multiple={false}
            showUploadList={false}
            onPreview={handlePreview}
            listType="picture-card"
            onRemove={remove}
            fileList={fileList}
            onChange={handleChange}
          >
            {uploadButton}
          </Upload>
          <Modal
            visible={previewOpen}
            title={previewTitle}
            footer={null}
            onCancel={handleCancel}
          >
            <img alt="example" style={{ width: '100%' }} src={previewImage} />
          </Modal>
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={loading}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
