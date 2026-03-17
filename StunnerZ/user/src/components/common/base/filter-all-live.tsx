import { PureComponent } from 'react';
import {
  Input, Button, Select, Row, Col
} from 'antd';
import { omit } from 'lodash';
import { IBody } from '@interfaces/index';
import './filter-all-live.less';

interface IProps {
  onSubmit: Function;
  bodyInfo: IBody;
  type?: string;
}

export class PerformerAdvancedFilterAllLive extends PureComponent<IProps> {
  state = {
    showMore: false
  };

  handleSubmit() {
    const { onSubmit } = this.props;
    onSubmit(omit(this.state, ['showMore']));
  }

  render() {
    return (
      <div style={{ width: '100%' }} className='custom-all-live'>
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
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}
