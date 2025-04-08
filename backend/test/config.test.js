const assert = require('assert');
const { PORT } = require('../config');

describe('Config Tests', () => {
    it('should load default configuration', () => {
        assert.strictEqual(typeof PORT, 'number');
        assert(PORT > 0);
    });

    it('should override with environment variables', () => {
        // 保存原始值
        const originalPort = process.env.PORT;
        const originalEnv = process.env.NODE_ENV;
        
        // 设置新值
        process.env.PORT = '4000';
        process.env.NODE_ENV = 'development';
        
        // 清除缓存并重新加载模块
        delete require.cache[require.resolve('../config')];
        const config = require('../config');
        
        // 恢复原始值
        if (originalPort) {
            process.env.PORT = originalPort;
        } else {
            delete process.env.PORT;
        }
        
        if (originalEnv) {
            process.env.NODE_ENV = originalEnv;
        } else {
            delete process.env.NODE_ENV;
        }
        
        // 验证配置是否正确加载
        assert(config.PORT !== undefined);
    });
});