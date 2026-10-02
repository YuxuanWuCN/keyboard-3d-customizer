# ⌨️ 客制化 3D 机械键盘工坊 (CyberKey 3D Customizer)

> 基于 React 18 + Three.js + React Three Fiber + Tailwind CSS 构建的高保真交互式 3D 客制化机械键盘组装、定制与声学模拟 Web 应用程序。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Three.js](https://img.shields.io/badge/Three.js-0.160-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)
![Tests](https://img.shields.io/badge/tests-115%2F115%20passed-brightgreen.svg)

---

## ✨ 核心特性 (Features)

### 1. 三大经典客制化外壳与配列无缝切换
- **晚星 75 (EveningStar 75)**：75% 紧凑配列（82 键），重现标志性侧边腰线切角、极窄边框、正面指示灯/铭牌，以及背部特色大面积 PVD 镜面黄铜配重。
- **西装 80 (Mr. Suit 80)**：80% TKL 经典配列（87 键），复刻温润圆角与极光炫彩一体式背部配重。
- **豆腐 60 (Tofu 60)**：60% 经典铝坨坨配列（61 键），极简锋利几何切角与黄铜配重条。

### 2. Gasket 堆叠层 3D 结构爆炸解构
- **7 层独立声学与物理构件**：
  1. 客制化键帽群（原厂高、PBT 磨砂 / ABS 高光）
  2. 机械轴体阵列（十字轴心、独立轴盖、5.5 圈螺旋镀金弹簧、导光柱与五脚底座）
  3. Gasket 软弹定位板（带减震挂耳）
  4. Poron 夹心棉与 IXPE 轴下垫（声优级消音垫片）
  5. 开槽沉金 PCB 电路板（热插拔轴座与单键开槽线条）
  6. 底部消音底棉（消除空腔杂音）
  7. 阳极 CNC 铝合金底壳与特色 PVD 配重块
- **爆炸解构滑块**：支持 0%（完全组装）到 100%（全层悬浮解构）自由滑动，并支持各构件的单独隔离检视与显隐切换。

### 3. 键帽深度色彩定制与客制化主题
- **经典客制化主题一键换装**：
  - `9009 复古灰白` (Classic Retro)
  - `赛博朋克 2077` (Cyberpunk)
  - `迈阿密风云` (Miami Nights)
  - `隐士深黑` (Dark Stealth)
  - `EVA 初号机` (Test Type 01)
  - `抹茶拿铁` (Matcha Milk)
  - `奥利维亚玫瑰金` (Olivia)
- **分区批量选择**：支持单键点选、字母区 (Alphas)、修饰大键 (Modifiers)、特色增补 (Space/Enter/Esc)、全选、反选与任意十六进制自定义取色。
- **物理材质与光泽切换**：PBT 细腻哑光（粗糙度 0.72 • 耐磨不打油）与 ABS 丝滑高光（粗糙度 0.18 • 清漆 0.85 润泽）。

### 4. 纯数学计算程序化声学引擎 (Zero-Audio Synthesis)
- **无需下载外部音频采样文件**：基于 Web Audio API 物理建模：
  - **Cherry MX 红轴**：顺滑线性下压，温润深沉石子音 (155-340Hz)。
  - **佳达隆 G黄 Pro**：乳白半透尼龙轴壳，饱满麻将音 (Mahjong Thock)。
  - **Cherry MX 青轴**：清脆发声弹片，高频炸裂 Click 响声 (3.8kHz)。
  - **圣熊猫 Holy Panda**：提前大段落，双峰段落微爆音。
  - **凯华 Box 翡翠**：加粗发声扭簧，清脆硬朗撞击回馈。
- **Poron 夹心棉声学阻尼滤波**：开启后过滤箱体高频谐波，还原真实厚润麻将音；关闭还原纯粹冷铝敲击空腔音。
- **24 通道动态复音限制与 Tanh 软饱和防破音算法**。

### 5. 交互式打字沙盒与实时 HUD 测速
- **实体键盘全键位联动**：在键盘上敲击打字，3D 视口内对应按键即时产生 3.8mm 物理行程下沉与弹簧回弹动效，伴随实时轴体声学并发反馈。
- **实时 Telemetry 测速**：净打字速度 (NET WPM)、原始速度 (Raw WPM)、击键准确率 (Accuracy)、错误按键统计与最近输入轨迹可视化。

---

## 🛠️ 本地开发与运行 (Getting Started)

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖
```bash
git clone <your-repo-url>
cd keyboard_3d_customizer
npm install
```

### 启动本地开发服务
```bash
npm run dev
```
启动后在浏览器打开：`http://localhost:5173/`

### 运行自动化测试
```bash
npm test
```
包含 8 组测试套件、115 项单元测试与极限工况验证：
- 配列与装配公差测试
- 运动学与爆炸图插值测试
- 客制化主题与材质着色测试
- 声学合成与冲击响应测试
- 极端并发打字与状态持久化测试

### 编译打包
```bash
npm run build
```
产物输出至 `dist/` 目录。

---

## 🚀 部署至 GitHub Pages

本项目内置了自动化部署工作流 (`.github/workflows/deploy.yml`)。
推送到 GitHub 仓库的 `main` 分支后：
1. 进入 GitHub 仓库设置页面：`Settings` -> `Pages`；
2. 在 **Build and deployment** 下将 **Source** 设置为 **GitHub Actions**；
3. Actions 工作流执行完毕后，即可通过 `https://<用户名>.github.io/<仓库名>/` 访问在线 3D 页面！

---

## 📄 开源许可证
MIT License.
