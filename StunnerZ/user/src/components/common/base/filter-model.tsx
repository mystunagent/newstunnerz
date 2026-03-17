import { PureComponent } from 'react';
import {
  Input, Button, Select, Row, Col
} from 'antd';
import { omit } from 'lodash';
import { IBody } from '@interfaces/index';
import './filter-model.less';

interface IProps {
  onSubmit: Function;
  bodyInfo: IBody;
  type?: string;
}

export class PerformerAdvancedFilter extends PureComponent<IProps> {
  state = {
    showMore: false
  };

  handleSubmit() {
    const { onSubmit } = this.props;
    onSubmit(omit(this.state, ['showMore']));
  }

  render() {
    return (
      <div style={{ width: '100%' }} className='custom-filter-model'>
        <Row>
          <Col lg={24} xs={24} md={24}>
            <div className="filter-block custom custom-main">
              <div className="custom-search">
                <Input
                  placeholder="Search Creators ..."
                  onChange={(evt) => this.setState({ q: evt.target.value })}
                  onPressEnter={this.handleSubmit.bind(this)}
                />
              </div>
              <div className="custom-btn">
                <div className="custom-btn-item">
                  <Button
                    onClick={() => this.setState({ sortBy: 'subscriber' }, () => this.handleSubmit())}
                  >
                    Most Followed
                  </Button>
                </div>
                <div className="custom-btn-item">
                  <Button
                    onClick={() => this.setState({ sortBy: 'latest' }, () => this.handleSubmit())}
                  >
                    New Joiners
                  </Button>
                </div>
              </div>
              {/* for mobile */}
              <div className="custom-select">
                <Select
                  style={{ width: '100%' }}
                  defaultValue=""
                  placeholder="Select items ..."
                  onChange={(val) => this.setState({ sortBy: val }, () => this.handleSubmit())}
                >
                  <Select.Option value="">Options</Select.Option>
                  <Select.Option value="subscriber">
                    Most Followed
                  </Select.Option>
                  <Select.Option value="latest">New Joiners</Select.Option>
                </Select>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}
