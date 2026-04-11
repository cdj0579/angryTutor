#!/bin/bash

# AngryTutor iOS 构建脚本

echo "🚀 开始构建 AngryTutor iOS 应用..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤1: 构建 web 资源
echo "${BLUE}📦 步骤 1: 构建 Web 资源...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo "${RED}❌ Web 构建失败${NC}"
    exit 1
fi
echo "${GREEN}✅ Web 资源构建成功${NC}"
echo ""

# 步骤2: 同步到 iOS
echo "${BLUE}📱 步骤 2: 同步到 iOS 项目...${NC}"
npx cap copy ios
if [ $? -ne 0 ]; then
    echo "${RED}❌ iOS 同步失败${NC}"
    exit 1
fi
echo "${GREEN}✅ iOS 资源同步成功${NC}"
echo ""

# 步骤3: 更新 iOS 插件
echo "${BLUE}🔧 步骤 3: 更新 iOS 插件...${NC}"
npx cap update ios
if [ $? -ne 0 ]; then
    echo "${RED}❌ iOS 更新失败${NC}"
    exit 1
fi
echo "${GREEN}✅ iOS 插件更新成功${NC}"
echo ""

# 步骤4: 打开 Xcode
echo "${BLUE}🎨 步骤 4: 打开 Xcode 项目...${NC}"
open ios/App/App.xcodeproj
if [ $? -ne 0 ]; then
    echo "${RED}❌ 无法打开 Xcode${NC}"
    exit 1
fi
echo "${GREEN}✅ Xcode 已打开${NC}"
echo ""

echo "${GREEN}🎉 构建完成！准备在 Xcode 中运行应用吧！${NC}"
echo ""
echo "📝 下一步:"
echo "1. 在 Xcode 中选择 iPhone 模拟器或真机"
echo "2. 点击 'Play' 按钮或按 Cmd + R 运行"
echo "3. 享受学习医院英语！🏥"
