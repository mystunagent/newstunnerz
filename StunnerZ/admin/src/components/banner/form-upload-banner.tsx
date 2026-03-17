import { PureComponent } from "react";
import { Form, Input, Select, Upload, Button, message, Progress } from "antd";
import { IBannerUpdate, IBannerCreate } from "src/interfaces";
import { LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import { getGlobalConfig } from "@services/config";

interface IProps {
  banner?: IBannerUpdate;
  submit: Function;
  beforeUpload?: Function;
  uploading?: boolean;
  uploadPercentage?: number;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

const validateMessages = {
  required: "This field is required!",
};

export class FormUploadBanner extends PureComponent<IProps> {
  state = {
    choosePosition: "",
    file: [],
  };

  componentDidUpdate(prevProps, prevState) {
    const { file, choosePosition } = this.state;
    if (choosePosition !== prevState.choosePosition && file.length > 0) {
      this.handleRemove(file);
    }
  }

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

  handleChange = (info) => {
    if (info.fileList.length > 0) {
      const { beforeUpload: handleBeforeUpload } = this.props;
      handleBeforeUpload(info.file.originFileObj);
      this.setState({ file: [info.file] });
    }
  };

  handleRemove = (file) => {
    const { beforeUpload: handleBeforeUpload } = this.props;
    if (file) {
      message.info("Please select again file before uploading banner");
      handleBeforeUpload(null);
      this.setState({ file: [] });
    }
  };

  beforeUpload(file) {
    const config = getGlobalConfig();
    const isMaxSize =
      file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5);
    if (!isMaxSize) {
      message.error(
        `Image must be smaller than ${
          config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5
        }MB!`
      );
    }
    return isMaxSize;
  }

  render() {
    const { banner, submit, uploading, uploadPercentage } = this.props;
    const { choosePosition, file } = this.state;
    const haveBanner = !!banner;

    return (
      <Form
        {...layout}
        onFinish={submit && submit.bind(this)}
        onFinishFailed={() =>
          message.error("Please complete the required fields")
        }
        name="form-upload-banner"
        validateMessages={validateMessages}
        initialValues={
          banner ||
          ({
            title: "",
            description: "",
            link: "",
            status: "active",
            position: "",
          } as IBannerCreate)
        }
      >
        <Form.Item
          name="title"
          rules={[{ required: true, message: "Please input title of banner!" }]}
          label="Title"
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          name="link"
          label="Direct link"
          rules={[
            // eslint-disable-next-line no-useless-escape
            {
              pattern:
                /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/,
              message: "Invalid url format",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="position"
          label="Position"
          rules={[{ required: true, message: "Please select position!" }]}
        >
          <Select
            onSelect={(e) => this.setState({ choosePosition: e.toString() })}
          >
            <Select.Option key="homePageTop" value="homePageTop">
              Home page Top
            </Select.Option>
            <Select.Option key="homeLiveStreaming" value="homeLiveStreaming">
              Home Live streaming
            </Select.Option>
            <Select.Option key="homeCreator" value="homeCreator">
              Home Creators to follow
            </Select.Option>
            <Select.Option key="allCreator" value="allCreator">
              All Creators page
            </Select.Option>
            <Select.Option key="allPost" value="allPost">
              All Posts Page
            </Select.Option>
            <Select.Option key="live" value="live">
              Live page
            </Select.Option>
            <Select.Option key="liveStreaming" value="liveStreaming">
              Live Streaming Page
            </Select.Option>
            <Select.Option key="availableStream" value="availableStream">
              Available Stream
            </Select.Option>
          </Select>
        </Form.Item>
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
        <Form.Item
          label={`${haveBanner || (choosePosition && "Banner")}`}
          help={`${
            haveBanner ||
            (choosePosition && "Ratio dimension 4:1.2 (eg: 1600px:480px)")
          }`}
        >
          {haveBanner ? (
            <img
              src={banner?.photo?.url || "./banner-image.jpg"}
              alt="banner"
              style={{ width: "100%" }}
            />
          ) : (
            choosePosition && (
              <ImgCrop
                aspect={choosePosition === "homePageTop" ? 2.2 / 1 : 4 / 1.2}
                shape="rect"
                quality={1}
                modalTitle="Edit cover image"
                modalWidth={768}
              >
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  fileList={file}
                  showUploadList
                  beforeUpload={this.beforeUpload.bind(this)}
                  onChange={this.handleChange}
                  onPreview={this.onPreview}
                  disabled={uploading}
                  onRemove={this.handleRemove}
                >
                  {uploading ? <LoadingOutlined /> : <UploadOutlined />}
                </Upload>
              </ImgCrop>
            )
          )}
        </Form.Item>
        {uploadPercentage ? (
          <Progress percent={Math.round(uploadPercentage)} />
        ) : null}
        <Form.Item className="text-center">
          <Button
            type="primary"
            htmlType="submit"
            loading={uploading}
            disabled={uploading}
          >
            {haveBanner ? "Update" : "Upload"}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
