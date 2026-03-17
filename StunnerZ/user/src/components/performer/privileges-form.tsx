import { PlusOutlined } from "@ant-design/icons";
import { generateUuid } from "@lib/string";
import { isObjectId, PERFORMER_PRIVILEGES } from "@lib/utils";
import { Button, Col, Form, InputNumber, Row, Select } from "antd";
import { useEffect, useState } from "react";
import "./privileges-form.less";

type IProps = {
  onFinish: (data: any[]) => void;
  onDelete: (item: any) => void;
  updating: boolean;
  deleting: boolean;
  data: any;
};
function PrivilegesForm({
  onFinish,
  onDelete,
  updating,
  data,
  deleting,
}: IProps) {
  const [form] = Form.useForm();
  const [privileges, setPrivileges] = useState<any[]>([]);

  const addPrivileges = () => {
    const uid = generateUuid();
    setPrivileges([
      ...privileges,
      {
        id: uid,
        privilege: "",
        commission: 0,
      },
    ]);
  };

  const removePrivileges = async (item) => {
    if (item && !isObjectId(item.id)) {
      return setPrivileges(privileges.filter((p) => p.id !== item.id));
    }
    await onDelete(item);
  };

  const fetchPrivileges = () => {
    setPrivileges(
      data.map((t) => ({
        id: t._id,
        privilege: t.privilege,
        commission: t.commission,
        showCommission: t.showCommission,
      }))
    );
  };

  useEffect(() => {
    fetchPrivileges();
  }, []);

  const handlePrivilegeChange = (index: number, value: string) => {
    setPrivileges(
      privileges.map((item, i) => {
        if (i === index) {
          return { ...item, privilege: value, commission: item.commission };
        }
        return item;
      })
    );
  };

  const handleSave = () => {
    onFinish(privileges);
  };

  const options = [
    {
      text: "Order History",
      key: PERFORMER_PRIVILEGES.ORDER,
      value: PERFORMER_PRIVILEGES.ORDER,
      showCommission: false,
    },
    // {
    //   text: "Subscribers",
    //   key: PERFORMER_PRIVILEGES.SUBSCRIPTION_LIST,
    //   value: PERFORMER_PRIVILEGES.SUBSCRIPTION_LIST,
    //   showCommission: false
    // },
    {
      text: "Subscribers",
      key: PERFORMER_PRIVILEGES.SUBSCRIPTION,
      value: PERFORMER_PRIVILEGES.SUBSCRIPTION,
      showCommission: true,
    },
    // {
    //   text: "Tip",
    //   key: PERFORMER_PRIVILEGES.TIP,
    //   value: PERFORMER_PRIVILEGES.TIP,
    //   showCommission: false
    // },
    {
      text: "Live Stream",
      key: PERFORMER_PRIVILEGES.STREAM,
      value: PERFORMER_PRIVILEGES.STREAM,
      showCommission: true,
    },
    {
      text: "Edit Profile",
      key: PERFORMER_PRIVILEGES.EDIT_PROFILE,
      value: PERFORMER_PRIVILEGES.EDIT_PROFILE,
      showCommission: false,
    },
    {
      text: "Black List",
      key: PERFORMER_PRIVILEGES.BLACK_LIST,
      value: PERFORMER_PRIVILEGES.BLACK_LIST,
      showCommission: false,
    },
    {
      text: "Block Countries",
      key: PERFORMER_PRIVILEGES.BLOCK_COUNTRIES,
      value: PERFORMER_PRIVILEGES.BLOCK_COUNTRIES,
      showCommission: false,
    },
    {
      text: "Referral",
      key: PERFORMER_PRIVILEGES.REFERRAL,
      value: PERFORMER_PRIVILEGES.REFERRAL,
      showCommission: false,
    },
    {
      text: "My Posts",
      key: PERFORMER_PRIVILEGES.POSTING,
      value: PERFORMER_PRIVILEGES.POSTING,
      showCommission: true,
    },
    {
      text: "Sexting",
      key: PERFORMER_PRIVILEGES.MESSAGES,
      value: PERFORMER_PRIVILEGES.MESSAGES,
      showCommission: true,
    },
    {
      text: "Welcome Message",
      key: PERFORMER_PRIVILEGES.WELCOME_MESSAGE,
      value: PERFORMER_PRIVILEGES.WELCOME_MESSAGE,
      showCommission: false,
    },
    // {
    //   text: "My Feeds",
    //   key: PERFORMER_PRIVILEGES.MY_FEED,
    //   value: PERFORMER_PRIVILEGES.MY_FEED,
    //   showCommission: false
    // },
    {
      text: "Available Time",
      key: PERFORMER_PRIVILEGES.AVAILABLE_TIME,
      value: PERFORMER_PRIVILEGES.AVAILABLE_TIME,
      showCommission: false,
    },
    {
      text: "Booking Stream",
      key: PERFORMER_PRIVILEGES.BOOKING_STREAM,
      value: PERFORMER_PRIVILEGES.BOOKING_STREAM,
      showCommission: true,
    },
    {
      text: "My Videos",
      key: PERFORMER_PRIVILEGES.VIDEOS,
      value: PERFORMER_PRIVILEGES.VIDEOS,
      showCommission: true,
    },
    // {
    //   text: "My Events",
    //   key: PERFORMER_PRIVILEGES.EVENTS,
    //   value: PERFORMER_PRIVILEGES.EVENTS,
    //   showCommission: true
    // },
    {
      text: "My Products",
      key: PERFORMER_PRIVILEGES.PRODUCTS,
      value: PERFORMER_PRIVILEGES.PRODUCTS,
      showCommission: true,
    },
    {
      text: "My Gallery",
      key: PERFORMER_PRIVILEGES.GALLERY,
      value: PERFORMER_PRIVILEGES.GALLERY,
      showCommission: true,
    },
  ];

  return (
    <Form
      form={form}
      initialValues={{
        privileges: [],
      }}
      layout="vertical"
      className="privileges-form"
    >
      <Form.Item shouldUpdate>
        {() => (
          <>
            <Row style={{ marginBottom: "10px" }}>
              <Col lg={16} md={16} xs={12}>
                <div
                  style={{
                    marginLeft: "10px",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  Privilege
                </div>
              </Col>
              <Col
                lg={4}
                md={4}
                xs={4}
                style={{
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                <div>Commission</div>
              </Col>
              <Col
                lg={4}
                md={4}
                xs={8}
                style={{
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                <div>Action</div>
              </Col>
            </Row>
            {privileges
              .filter(
                (item) =>
                  options.some((option) => option.value === item.privilege) ||
                  item.privilege === ""
              )
              .map((item, index) => (
                <Row key={item.id} style={{ margin: "10px" }}>
                  <Col lg={16} md={16} xs={12}>
                    <Select
                      value={item.privilege}
                      onChange={(value) => handlePrivilegeChange(index, value)}
                    >
                      {options.map((option) => (
                        <Select.Option
                          key={option.key}
                          value={option.value}
                          disabled={privileges.some(
                            (p) => p.privilege === option.value
                          )}
                        >
                          {option.text}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col lg={4} md={4} xs={4} style={{ textAlign: "center" }}>
                    {options.find((option) => option.value === item.privilege)
                      ?.showCommission && (
                      <InputNumber
                        style={{ textAlign: "center" }}
                        onChange={(e) => {
                          setPrivileges(
                            privileges.map((item, i) => {
                              if (i === index) {
                                return { ...item, commission: e };
                              }
                              return item;
                            })
                          );
                        }}
                        min={0}
                        max={100}
                        defaultValue={item?.commission}
                      />
                    )}
                  </Col>
                  <Col lg={4} md={4} xs={8} style={{ textAlign: "center" }}>
                    <Button
                      danger
                      onClick={() => removePrivileges(item)}
                      style={{ height: "100%" }}
                      loading={deleting}
                      disabled={deleting}
                    >
                      Delete
                    </Button>
                  </Col>
                </Row>
              ))}
          </>
        )}
      </Form.Item>
      <Form.Item>
        <p style={{ color: "red" }}>
          Note: If the agency commission is 20%, you will receive 80% of your
          net earnings
        </p>
      </Form.Item>
      <Form.Item>
        <Row>
          <Col lg={4} md={12} xs={24}>
            <Button className="primary" onClick={addPrivileges}>
              Add privileges
              <PlusOutlined />
            </Button>
          </Col>
          <Col lg={4} md={12} xs={24}>
            <Button
              disabled={updating}
              loading={updating}
              className="secondary"
              onClick={handleSave}
            >
              Save Privileges
            </Button>
          </Col>
        </Row>
      </Form.Item>
    </Form>
  );
}
export default PrivilegesForm;
