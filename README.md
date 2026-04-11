# AngryTutor - Hospital English Learning iOS App

一个创新的iOS英语学习应用，通过与一个"愤怒的护士"3D卡通形象互动来学习医院英语对话。

## 功能特性

### 🎮 游戏玩法
- **10个医院英语对话题目** - 真实的医疗场景对话
- **交互式学习** - 选择正确答案并得到即时反馈
- **3D护士角色** - 一个带胡子的卡通护士会根据你的答题表现做出反应

### 👨‍⚕️ 护士角色行为
- **正确答案** ✓ - 护士给出赞手势👍并得到+2分
- **错误答案** ✗ - 护士做出耳光动作，苦恼的表情，扣-2分

### 🏆 评分系统
- 每题2分（正确）或-2分（错误）
- 需要总分≥20分通关
- 总分<20分则失败
- 显示详细的答题统计和准确率

## 项目结构

```
.
├── src/                         # Vue 源代码
│   ├── components/
│   │   └── NurseCharacter.vue   # 3D护士角色组件（使用Three.js）
│   ├── views/
│   │   ├── HomePage.vue         # 首页菜单
│   │   └── LearningPage.vue     # 游戏/学习页面
│   ├── services/
│   │   └── gameService.ts       # 游戏逻辑和数据
│   ├── router/
│   │   └── index.ts             # 路由配置
│   ├── App.vue                  # 主应用组件
│   └── main.ts                  # 应用入口
├── ios/                         # iOS 原生项目
│   ├── App/                     # Xcode 项目
│   │   ├── App/                 # Swift 代码
│   │   ├── App.xcodeproj/       # Xcode 项目配置
│   │   └── Pods/                # CocoaPods 依赖
│   └── Podfile                  # CocoaPods 配置
├── dist/                        # 构建输出目录
├── public/                      # 静态资源
├── tests/                       # 测试文件
├── build-ios.sh                 # iOS 自动构建脚本
├── capacitor.config.ts          # Capacitor 配置
├── package.json                 # 项目依赖配置
├── vite.config.ts               # Vite 构建配置
└── tsconfig.json                # TypeScript 配置
```

## 技术栈

- **Vue 3** - 现代前端框架
- **TypeScript** - 类型安全
- **Ionic** - 移动UI框架
- **Three.js** - 3D图形库
- **Capacitor** - 跨平台移动框架
- **Xcode** - iOS 开发工具

## 安装和运行

### 快速开始（推荐）

一键构建并打开 Xcode：
```bash
./build-ios.sh
```

### 分步骤构建

**步骤 1: 安装依赖**
```bash
npm install
```

**步骤 2: 构建 Web 资源**
```bash
npm run build
```

**步骤 3: 同步到 iOS 项目**
```bash
npm run ios:build
```

**步骤 4: 打开 Xcode**
```bash
npm run ios:open
```

或直接打开：
```bash
open ios/App/App.xcodeproj
```

**步骤 5: 在 Xcode 中运行**
- 选择 iPhone 模拟器或真机设备
- 点击"Play"按钮（或按 Cmd + R）
- 等待应用编译和运行

### 开发工作流

修改代码后：
```bash
# 开发模式预览（Web版本）
npm run dev

# 准备部署到iOS
npm run ios:build
```

## 使用说明

### 在 iOS 设备上运行

1. **第一次设置**
   ```bash
   ./build-ios.sh
   ```
   这会自动完成所有步骤并打开 Xcode

2. **在 Xcode 中**
   - 顶部工具栏选择目标设备（iPhone 模拟器或真机）
   - 点击"Play"按钮运行应用
   - 或按 Cmd + R

3. **游戏流程**
   - 首页 - 点击"Start Learning"开始游戏
   - 游戏页面 - 
     - 左侧显示3D护士角色
     - 中间显示医院对话题目
     - 选择A、B、C选项之一
     - 护士会根据答案做出反应
   - 结果页面 - 
     - 显示最终分数
     - 显示是否通过（≥20分）
     - 显示准确率
     - 可以点击"Try Again"重新开始游戏

## 学习内容

应用包含10个医院英语对话，涵盖以下话题：
- 症状描述和检查
- 医院住院决定
- 药物用法
- 患者焦虑管理
- 手术前饮食
- 伤口护理
- 术后康复
- 饮水限制
- 康复运动
- 出院安排

## 3D护士角色

护士角色使用Three.js创建，完整包括：
- 身体和头部（肤色）
- 络腮胡子（黑色）
- 护士帽（白色，带红十字）
- 手臂（可动画）
- 眼睛

### 护士动画
- **空闲状态** - 缓慢旋转
- **点赞动画** - 右臂举起做点赞手势（正确答案）
- **耳光动画** - 右臂挥动做打屏幕状（错误答案）

## 系统要求

- **iOS 14.0+**
- **Xcode 14.0+** (用于开发和编译)
- **macOS 12+** (用于开发)
- **Node.js 16+** (用于构建)

## 原生语音输入支持（Moonshine 插件）

本项目包含一个自定义 Capacitor 插件 (`capacitor-plugins/moonshine`) ，
它封装了 Moonshine Voice 原生库，可在 iOS/Android 设备上提供低延迟
的本地语音转写和意图识别。

### 集成步骤

1. 在项目根目录安装插件：
   ```bash
   npm install ../capacitor-plugins/moonshine
   npx cap sync
   ```
2. 将 Moonshine 模型文件添加到应用资源中（见插件 `README.md`）。
3. 若需在前端使用，可调用 `src/services/moonshineService.ts` 中的
   `initMoonshine` / `stopMoonshine` 函数。
4. Web 端使用回退方案，当前只是记录警告，可改为转发给后端
   `/api/transcribe`。

- native 代码位于 `capacitor-plugins/moonshine/src/android` 和
  `src/ios`，包含 `TODO` 注释以提示集成 Moonshine SDK 的位置。
- 插件仍在原型阶段，需自行完成模型初始化和音频流处理。

以上特性可帮助你实现“语音输入和输出”功能，后端不再必需。


## 游戏规则

1. 需要在屏幕上方的评分区域看到实时分数
2. 进度条显示当前题目进度（N/10）
3. 每道题目有4个选项（A、B、C）
4. 选择答案后会立即显示反馈
5. 护士会做出相应的动画反应
6. 答题完毕后显示最终结果

## 未来功能计划

- [ ] 多个难度等级
- [ ] 更多医院场景（手术室、等候室等）
- [ ] 语音识别和发音评分
- [ ] 排行榜系统
- [ ] 每日挑战
- [ ] 离线模式支持

## 许可证

MIT

## 开发者联系

如有问题或建议，欢迎反馈！
