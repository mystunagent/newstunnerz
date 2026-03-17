import { Image, message, Select } from 'antd';
import {
  SearchOutlined, CloseOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import { performerService } from '@services/index';
import Router from 'next/router';

export default function SearchBarModel() {
  const [openSearch, setOpenSearch] = useState(false);
  const [filter, setFilter] = useState('');
  const [dataModel, setDataModel] = useState<any>();

  const onSearchModel = async (name) => {
    try {
      const { data } = await performerService.search({
        limit: 10,
        offset: 0,
        q: name
      });
      setDataModel(data?.data);
    } catch (error) {
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  };

  const handleChange = (newValue: string) => {
    setFilter(newValue);
  };

  const handleSearch = (newValue: string) => {
    onSearchModel(newValue);
  };

  const handleDirectModel = (data) => {
    Router.push(
      {
        pathname: '/creator/profile',
        query: { username: data?.username || data?._id }
      },
      `/${data?.username}`
    );
    setDataModel([]);
    setFilter('');
    setOpenSearch(false);
  };

  return (
    <div className="search-bar-feed">
      <Select
        className={openSearch ? 'active' : ''}
        showSearch
        listHeight={250}
        value={filter || ''}
        placeholder="Type to search here ..."
        defaultActiveFirstOption={false}
        showArrow={false}
        filterOption={false}
        onSearch={handleSearch}
        dropdownAlign={{ offset: [0, 5] }}
        style={{ width: '100%' }}
        onChange={handleChange}
        autoClearSearchValue
        onBlur={() => setFilter(null)}
        notFoundContent={null}
      >
        {dataModel && dataModel.map((data) => (
          <Select.Option value={data.username} key={data.username}>
            <div className="list-search" onClick={() => handleDirectModel(data)} aria-hidden>
              <span className="avatar-search" style={{ display: 'flex' }}>
                <Image preview={false} width={20} src={data.avatar || '/no-avatar.svg'} alt="" />
              </span>
              <div className="info-search">
                <span className="search-name">{data.name || ''}</span>
              </div>
            </div>
          </Select.Option>
        ))}
      </Select>
      <a
        aria-hidden
        className="open-search"
        onClick={() => setOpenSearch(!openSearch)}
      >
        {!openSearch ? <SearchOutlined /> : <CloseOutlined />}
      </a>
    </div>
  );
}
