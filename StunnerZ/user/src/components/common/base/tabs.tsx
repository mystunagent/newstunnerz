import React from 'react';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import RcTabs, { TabsProps as RcTabsProps } from 'rc-tabs';
import classnames from 'classnames';

export interface TabsProps extends RcTabsProps {
  animated?: any;
  size?: SizeType;
}

export const { TabPane } = RcTabs;

const Tabs = ({
  prefixCls = 'ant-tabs',
  size = 'large',
  animated = {
    inkBar: true,
    tabPane: false
  },
  defaultActiveKey,
  className,
  onChange,
  ...props
}: TabsProps) => {
  const [activeKey, setActiveKey] = React.useState(defaultActiveKey);
  const onTabClick = (key) => {
    setActiveKey(key);
    onChange && onChange(key);
  };
  return (
    <RcTabs
      className={classnames(className, { [`${prefixCls}-${size}`]: size })}
      prefixCls={prefixCls}
      activeKey={activeKey}
      defaultActiveKey={defaultActiveKey}
      renderTabBar={(_, TabNavList: any) => (
        <TabNavList
          animated={animated}
          onTabClick={onTabClick}
          activeKey={activeKey}
          className={className}
        />
      )}
      animated={animated}
      {...props}
    />
  );
};

export default Object.assign(Tabs, { TabPane });
