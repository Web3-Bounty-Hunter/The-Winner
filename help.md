## 安装

### 方法1：直接从GitHub克隆
```bash
git clone https://github.com/你的用户名/blockchain-components.git
cd blockchain-components
npm install
```

### 方法2：作为NPM包安装（如果发布了NPM包）
```bash
npm install @你的组织/blockchain-components
```
```

### 基本用法

```markdown
## 基本用法

1. 在应用的根组件中添加ContractProvider：

```jsx
import { ContractProvider } from 'blockchain-components';

function App() {
  return (
    <ContractProvider>
      <YourApp />
    </ContractProvider>
  );
}
```

2. 在任何组件中使用合约功能：

```jsx
import { useContractContext } from 'blockchain-components';

function MyComponent() {
  const { battleCoin, isConnected, connectWallet } = useContractContext();
  
  const handleTransfer = async () => {
    if (!isConnected) await connectWallet();
    await battleCoin.transfer('0x接收地址', '1.0');
  };
  
  return (
    <button onClick={handleTransfer}>转账</button>
  );
}
```
```

### 配置合约地址

```markdown
## 配置合约地址

在使用组件库前，需要配置正确的智能合约地址。修改 `contracts/ContractConfig.js`：

```js
export const CONTRACT_ADDRESSES = {
  BATTLE_COIN: "你的BattleCoin合约地址", 
  TOKEN_ACTIVITY: "你的TokenActivity合约地址",
  TOKEN_SWAP: "你的TokenSwap合约地址"
};
```
```

## 6. 你的伙伴使用流程

你的伙伴可以按照以下方式使用：

1. **克隆或安装组件库**：
   ```bash
   # 克隆方式
   git clone https://github.com/你的用户名/blockchain-components.git
   
   # 或npm安装方式（如果发布了）
   npm install @你的组织/blockchain-components
   ```

2. **复制需要的组件到他们的项目中**：
   可以整个复制，或只选取他们需要的部分

3. **配置合约地址**：
   在`ContractConfig.js`中配置正确的合约地址

4. **集成组件**：
   在项目中使用`ContractProvider`和其他组件

5. **调用合约函数**：
   使用`useContractContext` Hook调用合约函数

## 使用可能的问题及解决方案

为了让你的伙伴顺利使用，提前提供一些常见问题的解决方案：

1. **合约地址错误**：
   - 确保配置正确的网络和合约地址
   - 提供测试网和主网的合约地址配置示例

2. **MetaMask连接问题**：
   - 确保安装了MetaMask
   - 确保MetaMask连接到正确的网络

3. **合约ABI不匹配**：
   - 如果合约接口有变更，确保更新ABI
   - 提供如何获取最新ABI的说明

4. **依赖版本冲突**：
   - 明确指定ethers.js等依赖的版本
   - 提供如何解决依赖冲突的建议

这样，你的伙伴应该能够比较顺利地使用这些组件了。组件的模块化设计使得他们可以根据需要使用部分或全部功能。


## 基本用法

1. 在应用的根组件中添加ContractProvider：

```jsx
import { ContractProvider } from 'blockchain-components';

function App() {
  return (
    <ContractProvider>
      <YourApp />
    </ContractProvider>
  );
}
```

2. 在任何组件中使用合约功能：

```jsx
import { useContractContext } from 'blockchain-components';

function MyComponent() {
  const { battleCoin, isConnected, connectWallet } = useContractContext();
  
  const handleTransfer = async () => {
    if (!isConnected) await connectWallet();
    await battleCoin.transfer('0x接收地址', '1.0');
  };
  
  return (
    <button onClick={handleTransfer}>转账</button>
  );
}
```


## 配置合约地址

在使用组件库前，需要配置正确的智能合约地址。修改 `contracts/ContractConfig.js`：

```js
export const CONTRACT_ADDRESSES = {
  BATTLE_COIN: "你的BattleCoin合约地址", 
  TOKEN_ACTIVITY: "你的TokenActivity合约地址",
  TOKEN_SWAP: "你的TokenSwap合约地址"
};
```