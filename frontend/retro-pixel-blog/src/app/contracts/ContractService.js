import { ethers } from 'ethers';

const ERROR_MESSAGES = {
  WALLET_NOT_INSTALLED: '请安装MetaMask以继续使用应用',
  USER_REJECTED: '您拒绝了连接钱包的请求，请授权连接以继续使用应用',
  NO_ACCOUNTS: '未能获取钱包账户，请确保MetaMask已解锁',
  GENERIC_ERROR: '操作失败，请稍后再试或联系支持',
};

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
  }

  async connectWallet() {
    try {
      if (!window.ethereum) {
        console.error('MetaMask未检测到，请确保已安装MetaMask扩展');
        throw new Error(ERROR_MESSAGES.WALLET_NOT_INSTALLED);
      }

      // 使用 ethers v5.7 文档推荐的方式请求连接
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (!accounts || accounts.length === 0) {
        throw new Error(ERROR_MESSAGES.NO_ACCOUNTS);
      }

      this.address = accounts[0];
      this.signer = this.provider.getSigner();

      // 获取网络信息
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId.toString();
      this.isConnected = true;

      console.log('钱包连接成功:', {
        address: this.address,
        chainId: this.chainId,
      });

      return this.address;
    } catch (error) {
      if (error.code === 4001) {
        console.log('用户拒绝了连接请求');
        throw new Error(ERROR_MESSAGES.USER_REJECTED);
      }
      if (error.code === -32002) {
        console.log('MetaMask请求已在处理中，请检查MetaMask扩展');
        throw new Error('MetaMask请求已在处理中，请检查MetaMask扩展并完成操作');
      }
      console.error('连接钱包失败:', error);
      throw new Error(error.message || ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  async getEthBalance() {
    try {
      if (!this.isConnected || !this.address) {
        throw new Error('请先连接钱包');
      }
      const balance = await this.provider.getBalance(this.address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('获取ETH余额失败:', error);
      throw new Error(error.message || ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  getAddress() {
    return this.address;
  }

  getChainId() {
    return this.chainId;
  }

  isWalletConnected() {
    return this.isConnected;
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
  }
}

const walletService = new WalletService();
export default walletService;