<template>
  <div class="interview-review">
    <!-- 顶部导航栏 -->
    <header class="review-header">
      <div class="logo-container">
        <span class="logo-text">OfferComing</span>
      </div>
      <button type="button" class="back-btn" @click="goHome">返回首页</button>
    </header>

    <!-- 主内容区域 -->
    <main class="review-main">
      <!-- 左侧面试对话区 -->
      <div class="interview-chat">
    <div
      v-for="(item, idx) in chatRecords"
      :key="idx"
      :class="['chat-item', { interviewer: item.role === 'interviewer' }]"
    >
      <!-- 对话内容 -->
      <div class="chat-bubble">
        <div class="role-tag" :class="{ interviewer: item.role === 'interviewer' }">
          {{ item.role === 'interviewer' ? '面试官' : '你' }}
        </div>
        <p class="content">{{ item.content }}</p>
      </div>
    </div>
  </div>

      <!-- 右侧分析面板 -->
      <section class="analysis-panel">
        <!-- 标签导航
        <div class="tab-nav">
          <button
            v-for="(tab, tabIdx) in tabs"
            :key="tabIdx"
            @click="activeTab = tabIdx"
            :class="['tab-btn', { active: activeTab === tabIdx }]"
          >
            {{ tab }}
          </button>
        </div>
        -->

        <!-- 标签内容区 -->
        <div class="tab-content">
          <!-- 面试概要 -->
          <div v-if="activeTab === 0" class="summary-section">
            <div class="radar-chart-container">
              <!-- 模拟雷达图占位 -->
              <div ref="radarChart" class="radar-chart"></div>
            </div>
            <div class="summary-text">
              <p>在这次面试中，候选人面试官介绍了自己的学术背景、项目经验和专业技能，包括计算机科学硕士学位、全栈开发经验，以及使用HTML、CSS、JavaScript、React、Node.js等工具的能力。候选人表达了对加入长兴科技的强烈愿望，并询问了关于公司工作环境、团队协作以及面试官对其第一印象的问题。面试官对候选人的表达能力、创新思维和解决问题的能力给予了积极评价，并强调了持续学习和适应新技术的能力对于该职位的重要性。</p>
            </div>

            <!-- 优缺点分析 -->
            <div class="pros-cons">
              <div class="cons-box">
                <h3>缺点</h3>
                <ul>
                  <li>对本地化的了解不够深入</li>
                  <li>对数据处理自动化脚本的使用经验不足</li>
                </ul>
              </div>
              <div class="pros-box">
                <h3>优点</h3>
                <ul>
                  <li>良好的沟通和团队合作能力</li>
                  <li>快速适应新环境和调整时间规划的能力</li>
                  <li>较强的心理素质</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 问题分析 -->
          <div v-if="activeTab === 1" class="analysis-section">
            <p>问题分析模块内容占位...</p>
          </div>

          <!-- 面试官剖析 -->
          <div v-if="activeTab === 2" class="analyzer-section">
            <p>面试官剖析模块内容占位...</p>
          </div>

          <!-- 相关知识点 -->
          <div v-if="activeTab === 3" class="knowledge-section">
            <p>相关知识点模块内容占位...</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import * as echarts from 'echarts';
export default {
  // 数据选项（与其他选项平级）
  data() {
    return {
      // 雷达图配置
      chartOption: {
        title: { text: '技能评估雷达图' },
        radar: {
          indicator: [
            { name: '专业度', max: 10 },
            { name: '技能匹配度', max: 10 },
            { name: '逻辑思维能力', max: 10 },
            { name: '表达流畅度', max: 10 },
            { name: '创新能力', max: 10 },
            { name: '应变抗压能力', max: 10 }
          ]
        },
        series: [
          {
            name: '能力值',
            type: 'radar',
            data: [
              {
                value: [3, 6, 7, 5, 4, 9],
                name: '个人能力',
                areaStyle: { color: 'rgba(8,154,224,0.9)' },
                lineStyle: { color: 'rgba(135, 206, 235, 1)' }
              }
            ]
          }
        ]
      },
      // 面试对话数据
      chatRecords: [
        { role: 'interviewer', content: '先介绍一下你自己。' },
        { role: 'candidate', content: '您好，我是一名拥有计算机科学硕士学位的全栈开发者...' },
        { role: 'interviewer', content: '你平常是怎么处理浏览器的跨域的问题的？' },
        { role: 'candidate', content: '一般会遇到跨域问题，解决方法通常有两种：JSONP和CORS...' },
        { role: 'interviewer', content: '使用JSONP和CORS解决跨域问题时，通常会有什么区别？' },
        { role: 'candidate', content: 'JSONP虽然实现简单，但仅支持GET请求...' }
      ],
      // 标签导航
      tabs: ['面试概要', '问题分析', '面试官剖析', '相关知识点和概念'],
      activeTab: 0 // 当前激活标签
    };
  },
  mounted() {
    this.initRadarChart();
  },
  methods: {
    goHome() {
      this.$router.push('/job_info'); // 跳转到首页路径
    },
    initRadarChart() {
      const chartDom = this.$refs.radarChart;
      const myChart = echarts.init(chartDom);
      myChart.setOption(this.chartOption);

      window.addEventListener('resize', () => {
        myChart.resize();
      });
    }
  },
  beforeUnmount() {
    const chartDom = this.$refs.radarChart;
    const myChart = echarts.getInstanceByDom(chartDom);
    if (myChart) {
      myChart.dispose();
    }
  }
};
</script>

<style scoped lang="scss">
.interview-review {
  min-height: 100vh;
  background: #ebf4fa;
  font-family: 'Microsoft YaHei', sans-serif;

  // 顶部导航
  .review-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: #fff;
    border-bottom: 1px solid #d9f2ed;

    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .logo-text {
        font-size: 1.2rem;
        font-weight: 600;
        color: #409eff;
      }
    }

    .back-btn {
      padding: 0.5rem 1rem;
      background: #409eff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;

      &:hover {
        background: #66b1ff;
      }
    }
  }

  // 主内容布局
  .review-main {
    display: flex;
    padding: 2rem;
    gap: 2rem;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  // 左侧对话面板
.interview-chat {
  width: 100%;
  max-width: 420px;
  background: #f9fcff;
  border-radius: 12px;
  padding: 1.2rem;
  margin: 1rem 0;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* 单个对话项：统一间距 */
.chat-item {
  margin-bottom: 1.2rem;
}

/* 角色标签：居中显示 + 颜色区分 */
.role-tag {
  text-align: left;
  font-size: 0.85rem;
  color: #009d29;
  margin-bottom: 0.5rem;
  font-weight: bold;

  &.interviewer {
    color: #409eff;           /* 面试官标签蓝色 */
  }
}

/* 对话内容：左对齐 + 清晰排版 */
.content {
  text-align: left;
  font-size: 0.95rem;
  color: #333;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .interview-chat {
    max-width: 100%;
  }
}

  // 右侧分析面板
  .analysis-panel {
    flex: 2;
    background: #fff;
    border-radius: 8px;
    padding: 1rem;

    @media (max-width: 768px) {
      width: 100%;
    }

    // 标签导航
    .tab-nav {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;

      .tab-btn {
        padding: 0.6rem 1.2rem;
        background: #f5f7fa;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;

        &.active {
          background: #409eff;
          color: #fff;
        }
      }
    }

    // 标签内容区
    .tab-content {
      padding: 1rem;

      // 面试概要
      .summary-section {
        .radar-chart-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;

          .radar-placeholder {
            width: 180px;
            height: 180px;
            background: linear-gradient(135deg, #409eff, #67c23a);
            border-radius: 50%;
            opacity: 0.1;
          }
        }

        .summary-text {
          line-height: 1.6;
          color: #666;
          margin-bottom: 2rem;
          text-align: left;
        }

        // 优缺点
        .pros-cons {
          display: flex;
          gap: 2rem;

          @media (max-width: 768px) {
            flex-direction: column;
          }

          .cons-box, .pros-box {
            flex: 1;
            background: #f9f9f9;
            border-radius: 8px;
            padding: 1rem;

            h3 {
              margin-bottom: 1rem;
              color: #ff4d4f;
            }

            ul {
              list-style: disc;
              padding-left: 1.5rem;
              color: #666;
              line-height: 1.8;
              text-align: left;
            }
          }

          .pros-box {
            background: #f0f9f5;
            h3 {
              color: #67c23a;
            }
          }
        }
      }

      // 其他标签通用样式
      .analysis-section, .analyzer-section, .knowledge-section {
        line-height: 1.6;
        color: #666;
      }
    }
  }
}

.radar-chart-container {
  width: 100%;
  height: 300px; /* 设置容器高度 */
}

.radar-chart {
  width: 100%;
  height: 100%;
}
</style>