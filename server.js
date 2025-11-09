const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// MongoDB连接配置
const uri = "mongodb+srv://352806_db_user:541638gyk@cluster0.08bwkwj.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// 中间件配置
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 提供前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 处理数据提交
app.post('/submit', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: '信息不能为空' });
    }

    await client.connect();
    const database = client.db('web_submissions');
    const collection = database.collection('user_messages');
    
    const result = await collection.insertOne({
      message: message,
      timestamp: new Date(),
      ip: req.ip
    });
    
    res.json({ 
      success: true, 
      message: '数据提交成功',
      id: result.insertedId 
    });
    
  } catch (error) {
    console.error('数据库错误:', error);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误' 
    });
  } finally {
    await client.close();
  }
});

// 获取所有提交的数据
app.get('/messages', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('web_submissions');
    const collection = database.collection('user_messages');
    
    const messages = await collection.find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    res.json({ success: true, data: messages });
    
  } catch (error) {
    console.error('数据库错误:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取数据失败' 
    });
  } finally {
    await client.close();
  }
});

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected' });
  } finally {
    await client.close();
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`健康检查: http://localhost:${port}/health`);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  await client.close();
  process.exit(0);
});
