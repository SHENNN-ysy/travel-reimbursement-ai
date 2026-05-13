import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  UploadOutlined,
  FileTextOutlined,
  HomeOutlined,
  SettingOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/archive',
      icon: <UploadOutlined />,
      label: '资料上传',
    },
    {
      key: '/report',
      icon: <FileTextOutlined />,
      label: '报销报表',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      key: '/agent',
      icon: <RobotOutlined />,
      label: 'AI 助手',
    },
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/archive':
        return '资料上传';
      case '/report':
        return '报销报表';
      case '/settings':
        return '系统设置';
      case '/agent':
        return 'AI 助手';
      default:
        return '首页';
    }
  };

  return (
    <Layout className="main-layout">
      <Sider
        width={240}
        className="layout-sider"
        breakpoint="lg"
        collapsedWidth="0"
      >
        <div className="logo">
          <img src="/logo.png" alt="logo" className="logo-img" />
          <span className="logo-text">报销AI助手</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="sidebar-menu"
        />
      </Sider>
      <Layout>
        <Header className="layout-header">
          <div className="header-left">
            <h1 className="page-title">{getPageTitle()}</h1>
          </div>
        </Header>
        <Content className="layout-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
