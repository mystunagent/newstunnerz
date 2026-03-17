import { PureComponent, createRef } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  message,
  Progress,
  DatePicker,
  Switch,
  Row,
  Col,
} from "antd";
import { UploadOutlined, CameraOutlined } from "@ant-design/icons";
import { FormInstance } from "antd/lib/form";
import { SelectMultiPerformerDropdown } from "@components/performer/common/select-multi-performer-dropdown";
import moment from "moment";
import TextArea from "antd/lib/input/TextArea";

interface IProps {
  event?: any;
  submit?: Function;
  beforeUpload?: Function;
  uploading?: boolean;
  uploadPercentage?: number;
}
const { RangePicker } = DatePicker;

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

const validateMessages = {
  required: "This field is required!",
};

export class FormCreateNewEvent extends PureComponent<IProps> {
  state = {
    previewImageProduct: null,
    isDigitalProduct: false,
    digitalProductName: "",
    isOpen: false,
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
    const { event } = this.props;
    if (event) {
      this.setState({
        previewImageProduct: event?.image || "",
        isOpen: event?.isPrivate,
      });
    }
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: [...val],
    });
  }

  beforeUpload(file, field) {
    const { beforeUpload: handleUpload } = this.props;
    if (field === "image") {
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        this.setState({ previewImageProduct: reader.result })
      );
      reader.readAsDataURL(file);
    }
    if (field === "digitalFile") {
      this.setState({
        digitalProductName: file.name,
      });
    }
    handleUpload(file, field);
    return false;
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { event, submit, uploading, uploadPercentage } = this.props;
    const {
      previewImageProduct,
      isDigitalProduct,
      digitalProductName,
      isOpen,
    } = this.state;
    const haveProduct = !!event;
    return (
      <div className="feed-form">
        <Form
          {...layout}
          onFinish={submit && submit.bind(this)}
          onFinishFailed={() =>
            message.error("Please complete the required fields")
          }
          name="form-upload"
          ref={this.formRef}
          validateMessages={validateMessages}
          initialValues={
            event || {
              name: "",
              email: "",
              mobile: "",
              info: "",
              address: "",
              hosted: "",
              status: "active",
              isPrivate: false,
              performerIds: [],
            }
          }
        >
          <Row>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                name="name"
                rules={[
                  { required: true, message: "Please input name of event!" },
                ]}
                label="Event Name"
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="date"
                rules={[{ required: !event, message: "Please choose date!" }]}
                label="Date?"
              >
                <RangePicker
                  defaultValue={
                    event
                      ? [moment(event?.startAt), moment(event?.endAt)]
                      : null
                  }
                  showTime={{ format: "HH:mm" }}
                  format="DD-MM-YYYY HH:mm"
                  disabledDate={(currentDate) =>
                    currentDate && currentDate < moment()
                  }
                />
              </Form.Item>
              <Form.Item
                name="price"
                label="Event price"
                rules={[
                  { required: true, message: "Please input price!" },
                ]}
              >
                <InputNumber min={0} />
              </Form.Item>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please input email!" },
                  {
                    type: "email",
                    message: "Please input a valid email address!",
                  },
                ]}
                label="Email"
              >
                <Input />
              </Form.Item>
              <Form.Item name="mobile" label="Mobile">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Form.Item
                name="address"
                rules={[
                  { required: true, message: "Please input address of event!" },
                ]}
                label="Location Address"
              >
                <TextArea rows={3} />
              </Form.Item>
              <Form.Item
                name="hosted"
                rules={[{ required: true, message: "Please input hosted!" }]}
                label="Hosted"
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="availability"
                rules={[
                  { required: true, message: "Please input availability!" },
                ]}
                label="Availability"
              >
                <InputNumber min={0} />
              </Form.Item>
              <Form.Item name="info" label="Info/Eligibility">
                <TextArea rows={3} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Form.Item
                name="isPrivate"
                rules={[{ required: true, message: "Please setup private!" }]}
                label="For Private?"
              >
                <Switch
                  defaultChecked={isOpen}
                  checked={isOpen}
                  onChange={(val: any) => this.setState({ isOpen: val })}
                />
              </Form.Item>
              {isOpen && (
                <Form.Item name="performerIds" label="Model">
                  <SelectMultiPerformerDropdown
                    showAll
                    defaultValue={event?.performerIds || []}
                    onSelect={(val) => this.setFormVal("performerIds", val)}
                  />
                </Form.Item>
              )}
              <Form.Item label="Image">
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  className="avatar-uploader"
                  multiple={false}
                  showUploadList={false}
                  disabled={uploading}
                  beforeUpload={(file) => this.beforeUpload(file, "image")}
                >
                  {previewImageProduct && (
                    <img src={previewImageProduct} alt="file" width="100%" />
                  )}
                  <CameraOutlined />
                </Upload>
              </Form.Item>
              {isDigitalProduct && (
                <Form.Item
                  label="Digital file"
                  help={digitalProductName || null}
                >
                  <Upload
                    multiple={false}
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList
                    disabled={uploading || haveProduct}
                    beforeUpload={(file) =>
                      this.beforeUpload(file, "digitalFile")
                    }
                  >
                    <UploadOutlined />
                  </Upload>
                  {uploadPercentage ? (
                    <Progress percent={uploadPercentage} />
                  ) : null}
                </Form.Item>
              )}
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status!" }]}
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
              <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
                <Button type="primary" htmlType="submit" loading={uploading}>
                  {haveProduct ? "Update" : "Upload"}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    );
  }
}
