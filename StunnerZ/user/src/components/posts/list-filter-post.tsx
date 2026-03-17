import {
  Button,
  Input, Menu
} from 'antd';
import { useEffect, useState } from 'react';
import './list-filter-post.less';

type IProps = {
  handleFilter: Function;
}
export function ListFilterPosts({ handleFilter }: IProps) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');

  const handleClear = () => {
    setType('');
    setQ('');
  };

  useEffect(() => {
    handleFilter({ type, q });
  }, [type, q]);

  return (
    <>
      <div className="main-posts-filter">
        <div>
          <div className="custom">
            <div className="custom-search">
              <Input
                placeholder="Enter a keyword to search ..."
                onChange={(evt) => setQ(evt.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="filter-post-option">
          <Menu mode="inline" title="Type" selectedKeys={[type.toString()]} onSelect={(item) => setType(item.key)}>
            <Menu.SubMenu title="Type">
              <Menu.Item key="text">
                Text
              </Menu.Item>
              <Menu.Item key="video">
                Video
              </Menu.Item>
              <Menu.Item key="photo">
                Photo
              </Menu.Item>
            </Menu.SubMenu>
          </Menu>
        </div>
        <div className="btn-clear-filter">
          <Button onClick={handleClear} type="primary">
            Clear
          </Button>
        </div>
      </div>
    </>
  );
}
