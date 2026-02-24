# 截图自动化说明 (Screenshot Automation)

支持**原生 Android** 的截图与页面测试，无需 Playwright。

## 方式一：Maestro（推荐 - 全自动）

[Maestro](https://docs.maestro.mobile.dev) 专为原生移动应用设计，支持自动登录、导航、截图。

### 安装 Maestro

**Windows**：下载 [Maestro Studio](https://docs.maestro.mobile.dev/getting-started/installing-maestro/windows) 或使用：

```bash
# 使用 scoop（如已安装）
scoop install maestro
```

或从 [Maestro 官网](https://maestro.mobile.dev) 下载安装包。

### 运行

1. 启动应用：`npx expo run:android -d`
2. 确保设备/模拟器已连接：`adb devices`
3. 运行 Maestro 流程（**截图自动保存到 `screenshots/` 文件夹**）：

```bash
npm run screenshot:maestro
```

或直接：
```bash
maestro test .maestro/screenshot-all-pages.yaml --output-dir screenshots
```

### 流程说明

- **登录**：preprod / Password@123
- **Time Clock**：点击数字 “1” 后点击 “Clock In”
- 依次访问：Dashboard → Sales History → Reports → Customers → Parked Orders → Sales Return → Settings → Add Products
- 每页自动截图，保存至 `screenshots/` 目录

---

## 方式二：ADB 脚本（无需额外安装）

仅需 Android SDK 自带的 ADB，无 Maestro/Playwright。

### 快速截图

```bash
# 单次截图（当前屏幕）
npm run screenshot 01-dashboard

# 或直接
node scripts/adb-screenshot.js 01-dashboard
```

### 交互模式（逐页手动导航 + 截图）

```bash
npm run screenshot:interactive
```

1. 在设备上手动打开要截图的页面
2. 终端按 Enter
3. 输入文件名（如 `01-login`），无需 `.png`
4. 重复以上步骤截取更多页面

### 前置条件

- 已连接 Android 设备或模拟器（`adb devices`）
- 应用已启动（`npx expo run:android -d`）

---

## 截图保存位置

默认保存在项目根目录下的 `screenshots/` 文件夹，会自动创建。

---

## 测试账号

- **用户名**：preprod
- **密码**：Password@123

---

## Time Clock 说明

Time Clock 需要先输入至少一位数字（如 “1”）才能点击 “Clock In” 完成打卡。Maestro 流程已按此逻辑编写。
