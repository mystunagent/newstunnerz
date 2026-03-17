import { PureComponent } from "react";
import { Button, Col, Menu, Modal, Row } from "antd";
import { omit, pick } from "lodash";
import { ICountry, IBody } from "@interfaces/index";
import "./options-filter-model-mobile.less";

interface IProps {
  onSubmit: Function;
  countries: ICountry[];
  loadMore: Function;
  bodyInfo: IBody;
  username: any[];
  total: number;
}

export class OptionsFilterAllCreatorOnMobile extends PureComponent<IProps> {
  state = {
    q: "",
    l: 12,
    o: 0,
    itemCountries: [],
    ethnicity: "",
    gender: "",
    hair: "",
    breastSize: "",
    butt: "",
    country: "",
    openModal: false
  };

  componentDidMount(): void {
    this.handleLoadMoreCountry();
  }

  handleSubmit() {
    const { onSubmit } = this.props;
    const stateWithoutItemCountries = pick(
      this.state,
      Object.keys(this.state).filter(
        (key) => key !== ("itemCountries" || "o" || "l" || 'openModal')
      )
    );
    onSubmit(omit(stateWithoutItemCountries, ["showMore"]));
    this.setState({ openModal: false });
  }

  async handleLoadMoreCountry() {
    const { countries } = this.props;
    const { l, o, itemCountries } = this.state;
    const result = await countries.slice(o, l + o);
    if (itemCountries?.length > 0) {
      this.setState({ itemCountries: [...itemCountries, ...result] });
    } else {
      this.setState({ itemCountries: [...result] });
    }
  }

  handleClear = () => {
    this.setState(
      {
        ethnicity: "",
        gender: "",
        hair: "",
        breastSize: "",
        butt: "",
        q: "",
        country: "",
      },
      () => {
        this.handleSubmit();
      }
    );
  };

  render() {
    const { bodyInfo, loadMore, username, total, countries } = this.props;
    const {
      l,
      o,
      itemCountries,
      q,
      breastSize,
      butt,
      country,
      ethnicity,
      gender,
      hair,
      openModal
    } = this.state;
    const { genders = [], ethnicities = [], hairs = [], butts = [] } = bodyInfo;

    return (
      <div className="menu-option-filter-model-on-mobile">
        <div className="advance-filter-live">
          <Button onClick={() => this.setState({ openModal: true })}>Advanced Filter</Button>
        </div>

        <Modal
          visible={openModal}
          onCancel={() => this.setState({ openModal: false })}
          footer={false}
          title="Advanced Filter"
          maskClosable={false}
          className="advance-modal-option"
        >
          <Row>
            <Col md={24} xs={24} lg={24}>
              <Menu
                mode="inline"
                className="menu-options-items"
                onSelect={(item: any) => this.setState({ q: item.key })}
                selectedKeys={[q.toString()]}
              >
                <Menu.SubMenu title="Name">
                  {username &&
                    username?.map((c) => (
                      <Menu.Item key={c.name}>{c.name}</Menu.Item>
                    ))}
                  {username?.length !== total && (
                    <Menu.Item>
                      <Button onClick={() => loadMore()}>Load More</Button>
                    </Menu.Item>
                  )}
                </Menu.SubMenu>
              </Menu>
              <Menu
                mode="inline"
                className="menu-options-items"
                onSelect={(item: any) => this.setState({ country: item.key })}
                selectedKeys={[country.toString()]}
              >
                <Menu.SubMenu title="Country">
                  {itemCountries.map((c) => (
                    <Menu.Item key={c.code}>
                      <img alt="flag" src={c.flag} width="25px" />
                      &nbsp;
                      {c.name}
                    </Menu.Item>
                  ))}
                  {itemCountries?.length !== countries?.length && (
                    <Menu.Item>
                      <Button
                        onClick={() =>
                          this.setState({ o: o + l }, () =>
                            this.handleLoadMoreCountry()
                          )
                        }
                      >
                        Load More
                      </Button>
                    </Menu.Item>
                  )}
                </Menu.SubMenu>
              </Menu>
              <Menu
                mode="inline"
                className="menu-options-items"
                onSelect={(item: any) => this.setState({ ethnicity: item.key })}
                selectedKeys={[ethnicity.toString()]}
              >
                <Menu.SubMenu title="Ethnicity">
                  {ethnicities.map((e) => (
                    <Menu.Item key={e.value}>{e.text}</Menu.Item>
                  ))}
                </Menu.SubMenu>
              </Menu>
              <Menu
                mode="inline"
                className="menu-options-items"
                onSelect={(item: any) => this.setState({ gender: item.key })}
                selectedKeys={[gender.toString()]}
              >
                <Menu.SubMenu title="Gender">
                  {genders?.map((e) => (
                    <Menu.Item key={e.value}>{e.text}</Menu.Item>
                  ))}
                </Menu.SubMenu>
              </Menu>
              <Menu
                mode="inline"
                className="menu-options-items"
                onSelect={(item: any) => this.setState({ hair: item.key })}
                selectedKeys={[hair.toString()]}
              >
                <Menu.SubMenu title="Hair Color">
                  {hairs.map((e) => (
                    <Menu.Item key={e.value}>{e.text}</Menu.Item>
                  ))}
                </Menu.SubMenu>
              </Menu>
              <Menu
                mode="inline"
                className="menu-options-items"
                onSelect={(item: any) =>
                  this.setState({ breastSize: item.key })
                }
                selectedKeys={[breastSize.toString()]}
              >
                <Menu.SubMenu title="Boobs">
                  {bodyInfo &&
                    bodyInfo.breastSize?.map((e) => (
                      <Menu.Item
                        onClick={() => this.setState({ breastSize: e.value })}
                        key={e.value}
                      >
                        {e.text}
                      </Menu.Item>
                    ))}
                </Menu.SubMenu>
              </Menu>
              <Menu
                mode="inline"
                className="menu-options-items"
                onSelect={(item: any) => this.setState({ butt: item.key })}
                selectedKeys={[butt.toString()]}
              >
                <Menu.SubMenu title="Butt">
                  {butts.map((e) => (
                    <Menu.Item
                      onClick={() => this.setState({ butt: e.value })}
                      key={e.value}
                    >
                      {e.text}
                    </Menu.Item>
                  ))}
                </Menu.SubMenu>
              </Menu>
              <br />
              <Button
                onClick={() => this.handleSubmit()}
                className="btn-options btn-options-primary"
                type="primary"
              >
                APPLY
              </Button>
              <br />
              <br />
              <Button
                onClick={() => this.handleClear()}
                className="btn-options"
              >
                CLEAR
              </Button>
            </Col>
          </Row>
        </Modal>
      </div>
    );
  }
}
