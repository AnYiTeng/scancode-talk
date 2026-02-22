import { Button, Card, Space } from 'antd';
import logo from './logo.svg';
import './App.scss';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <Space size="middle">
          <Button type="primary">Primary</Button>
          <Button>Default</Button>
        </Space>
        <Card title="Ant Design" style={{ marginTop: 16, minWidth: 300 }}>
          Ant Design 已成功引入，可直接使用各组件。
        </Card>
      </header>
    </div>
  );
}

export default App;
