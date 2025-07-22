# interview_eye

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Directory Structure
src/
├── assets/                     # 静态资源（图片、图标等）
├── components/                 # 通用组件
│   ├── ui/                     # UI 组件库
│   │   ├── bg-falling-stars/   # 等待题目生成界面流星背景组件
│   │   │   └── FallingStarsBg.vue
│   ├── AudioVisualizer.vue     # 面试界面面试官音频可视化组件
│   ├── HelloWorld.vue          # 示例组件（useless）
│   ├── StepBar.vue             # 信息录入步骤条组件
│   └── userAudio.vue           # 面试界面用户音频可视化组件
├── lib/                        # 工具库（工具函数、全局配置等）
├── router/                     # 路由配置
│   └── index.js                # 路由入口
├── view/                       # 页面视图
│   ├── Interview/              # 面试流程模块
│   │   ├── ConfigView.vue      # 面试配置页
│   │   ├── Device_Test.vue     # 设备检测页
│   │   ├── Fin_Preparation.vue # 最终准备页s4
│   │   ├── Guess_Ques.vue      # 面试押题页s3
│   │   ├── Job_Info.vue        # 岗位信息页s1
│   │   └── Sel_CV.vue          # 简历选择页s2
│   ├── login/                  # 登录模块
│   │   ├── LoginView.vue       # 登录页
│   │   └── RegisterView.vue    # 注册页
│   └── Mock/                   # 模拟面试模块
│       ├── BasedView.vue       # 基础模拟页
│       └── CodingView.vue      # 编码模拟页
├── App.vue                     # 根组件
└── main.js                     # 入口文件



### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
