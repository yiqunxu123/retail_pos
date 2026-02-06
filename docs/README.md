# KHUB Retail POS 文档中心

本文档集合提供了从 Web 应用到 React Native APP 迁移功能的完整指南。

---

## 📚 文档列表

### 1. [迁移指南](./MIGRATION_GUIDE.md)
**适用于**: 开发人员需要将 Web 功能迁移到 APP

**内容包括**:
- ✅ 完整的迁移步骤（4步法）
- ✅ 数据表定义的三层结构
- ✅ Web 和 APP 页面完整映射表
- ✅ 代码示例对比
- ✅ 常见问题解答
- ✅ 最佳实践

**关键章节**:
- [页面映射关系](./MIGRATION_GUIDE.md#页面映射关系) - 查看所有页面对应关系
- [迁移步骤详解](./MIGRATION_GUIDE.md#迁移步骤详解) - 跟随步骤迁移功能
- [代码示例](./MIGRATION_GUIDE.md#代码示例) - 客户列表完整示例

---

### 2. [架构文档](./ARCHITECTURE.md)
**适用于**: 了解系统整体架构和技术选型

**内容包括**:
- 🏗️ 完整的系统架构图
- 🔄 PowerSync 数据同步机制详解
- 📊 技术栈全景（Backend、Web、APP）
- 🗂️ 模块架构和目录结构
- 🔒 安全认证架构
- ⚡ 性能优化策略

**关键章节**:
- [整体架构](./ARCHITECTURE.md#整体架构) - 理解系统全貌
- [数据同步架构](./ARCHITECTURE.md#数据同步架构) - PowerSync 工作原理
- [技术栈详解](./ARCHITECTURE.md#技术栈详解) - 所有使用的技术
- [数据流图](./ARCHITECTURE.md#数据流图) - 读写操作流程

---

### 3. [数据表使用指南](./DataTable-Usage.md)
**适用于**: 在 APP 中使用统一的 DataTable 组件

**内容包括**:
- 📋 DataTable 组件完整 API
- 🎨 列配置和样式定制
- 🔍 搜索和筛选功能
- 📱 响应式布局
- 💡 使用示例

---

## 🚀 快速开始

### 如果你想...

#### 1️⃣ **迁移一个新页面**
1. 阅读 [迁移指南 - 迁移步骤](./MIGRATION_GUIDE.md#迁移步骤详解)
2. 参考 [页面映射表](./MIGRATION_GUIDE.md#页面映射关系) 找到对应的 Web 页面
3. 跟随 4 步迁移流程

#### 2️⃣ **理解数据同步机制**
1. 阅读 [架构文档 - 数据同步架构](./ARCHITECTURE.md#数据同步架构)
2. 查看时序图理解同步流程
3. 了解冲突处理策略

#### 3️⃣ **添加新的数据表同步**
1. 查看 [迁移指南 - 步骤 1](./MIGRATION_GUIDE.md#步骤-1-确认数据表已同步)
2. 编辑 `powersync/sync_rules.yaml`
3. 更新 `utils/powersync/schema.ts`
4. 创建对应的 Hook

#### 4️⃣ **创建数据列表页面**
1. 参考 [代码示例 - 客户列表](./MIGRATION_GUIDE.md#完整迁移示例-客户列表)
2. 使用 [DataTable 组件](./DataTable-Usage.md)
3. 创建 PowerSync Hook

---

## 📖 文档导航

### 按功能模块查找

#### Catalog 模块 (产品目录)
- [Web 页面位置](./MIGRATION_GUIDE.md#3-catalog-模块-产品目录)
- [APP 页面位置](./ARCHITECTURE.md#react-native-app-module-structure)
- 数据表: `products`, `categories`, `brands`, `unit_prices`

#### Inventory 模块 (库存管理)
- [Web 页面位置](./MIGRATION_GUIDE.md#4-inventory-模块-库存管理)
- [APP 页面位置](./ARCHITECTURE.md#react-native-app-module-structure)
- 数据表: `stocks`, `channels`, `suppliers`

#### Sale 模块 (销售管理)
- [Web 页面位置](./MIGRATION_GUIDE.md#5-sale-模块-销售管理)
- [APP 页面位置](./ARCHITECTURE.md#react-native-app-module-structure)
- 数据表: `customers`, `sale_orders`, `payments`

---

## 🗂️ 代码位置速查

### Backend (后端)
```
kapp/server/
├── models/tenant/        # SQLAlchemy 数据模型
│   ├── catalog_models/   # 产品、品牌、分类
│   ├── core_models/      # 客户、用户
│   └── sale_models/      # 订单、支付
├── app/tenant/           # API 端点
└── migrations/           # 数据库迁移
```

### Web Frontend (Web 前端)
```
kapp/client/tenant/src/
├── app/modules/          # 功能模块
│   ├── Catalog/          # 产品目录
│   ├── Sale/             # 销售管理
│   └── Inventory/        # 库存管理
└── constants/config/     # API 端点配置
```

### React Native APP
```
retail_pos-main/
├── app/                  # Expo Router 页面
│   ├── catalog/          # 产品页面
│   ├── sale/             # 销售页面
│   └── inventory/        # 库存页面
├── components/           # 共享组件
├── utils/powersync/      # PowerSync 集成
│   ├── schema.ts         # 本地数据库 Schema
│   └── hooks/            # 数据获取 Hooks
└── powersync/            # PowerSync 配置
    ├── config.yaml       # 服务器配置
    └── sync_rules.yaml   # 同步规则
```

---

## 📊 页面完成度统计

| 模块 | Web 页面 | APP 已实现 | 完成度 |
|------|---------|-----------|--------|
| **认证** | 2 | 2 | 100% ✅ |
| **Dashboard** | 2 | 1 | 50% ⚠️ |
| **Catalog** | 8 | 2 | 25% ⚠️ |
| **Inventory** | 9 | 2 | 22% ⚠️ |
| **Sale** | 10 | 8 | 80% 🎯 |
| **Order** | 3 | 3 | 100% ✅ |
| **POS** | 0 | 1 | - (APP 独有) |
| **Report** | 6 类 | 6 类 + 50+ 详细报表 | 100% ✅ |

**总体完成度**: ~40% (核心 POS 功能完整)

---

## 🛠️ 开发工具

### 推荐的 VS Code 插件
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- SQLite Viewer (查看本地数据库)
- Docker (管理 PowerSync 容器)

### 调试工具
- **Web**: Redux DevTools Extension
- **APP**: React Native Debugger / Expo DevTools
- **PowerSync**: Docker logs (`docker-compose logs -f powersync`)
- **数据库**: PowerSync 执行 SQL 查询

---

## 📝 贡献指南

### 更新文档
如果你发现文档有误或需要补充，请：

1. 编辑对应的 `.md` 文件
2. 确保链接正确
3. 更新"最后更新"日期
4. 提交 PR 或通知维护者

### 添加新示例
在 [迁移指南](./MIGRATION_GUIDE.md#代码示例) 的"代码示例"章节添加新的迁移案例。

---

## 🔗 相关资源

### 官方文档
- [Expo 文档](https://docs.expo.dev/)
- [PowerSync 文档](https://docs.powersync.com/)
- [React Native 文档](https://reactnative.dev/)
- [Flask 文档](https://flask.palletsprojects.com/)

### 项目文档
- [项目 README](../README.md) - 项目概述和快速开始
- [环境变量示例](../env.example) - APP 环境配置
- [PowerSync 配置](../powersync/README.md) - PowerSync 设置

---

## ❓ 获取帮助

### 常见问题
请先查阅 [迁移指南 - 常见问题](./MIGRATION_GUIDE.md#常见问题)

### 技术支持
- 后端问题: 查看 `kapp/server/` 代码
- APP 问题: 查看 `app/` 和 `components/` 代码
- 同步问题: 查看 [架构文档 - 数据同步](./ARCHITECTURE.md#数据同步架构)

---

## 📅 更新日志

### 2024-02-05
- ✅ 创建迁移指南文档
- ✅ 创建架构文档
- ✅ 创建文档索引
- ✅ 添加完整的页面映射表
- ✅ 添加详细的迁移步骤
- ✅ 添加代码示例

---

**文档维护**: Development Team  
**最后更新**: 2024-02-05  
**版本**: 1.0.0
