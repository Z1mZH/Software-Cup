<template>
  <div class="login-container">
    <!-- 左侧登录表单 -->
    <div class="login-left">
      <div class="login-content">
        <div class="logo-group">
          <icon-park
            type="Whale"
            size="70"
            fill="#4299e1"
            class="feature-icon"
          />
          <h1 class="app-name">OfferComing</h1>
        </div>
        <p class="welcome-message">欢迎回来，请登录您的账号</p>

        <form class="login-form">
          <!-- 用户名输入 -->
          <div class="form-group">
            <input
              type="text"
              v-model="username"
              placeholder="请输入用户名"
              class="input-field"
            />

          </div>

          <!-- 密码输入 -->
          <div class="form-group">
            <input
              type="password"
              v-model="password"
              placeholder="请输入密码"
              class="input-field"
            />
          </div>

          <!-- 记住密码 & 忘记密码 -->
          <div class="remember-forget">
            <label class="remember-label">
              <input type="checkbox" v-model="rememberMe" />
              记住密码
            </label>
            <a href="#" class="forget-link">忘记密码？</a>
          </div>

          <!-- 登录按钮 -->
          <button
            type="button"
            class="login-btn"
            @click="handleLogin"
          >
            登录
          </button>

          <!-- 注册入口 -->
          <p class="register-tip">
            还没有账号？
            <a href="/register" class="register-link">立即注册</a>
          </p>
        </form>
      </div>
    </div>

    <!-- 右侧背景图 -->
    <div class="features-section">
      <h2 class="section-title">OfferComing的优势</h2>
      <div class="features-grid">
        <div
          class="feature-card"
          @mouseover="handleHover(0)"
          @mouseout="handleLeave(0)"
        >
          <icon-park
            type="Lightning"
            size="60"
            fill="#4299e1"
            class="feature-icon"
          />
          <h3>实时响应</h3>
          <p class="feature-desc">毫秒级响应，快速解答面试问题，模拟真实场景。</p>
        </div>
        <div
          class="feature-card"
          @mouseover="handleHover(1)"
          @mouseout="handleLeave(1)"
        >
          <icon-park
            type="Aiming"
            size="60"
            fill="#4299e1"
            class="feature-icon"
          />
          <h3>95%匹配率</h3>
          <p class="feature-desc">精准匹配行业问题，覆盖95%以上技术场景。</p>
        </div>
        <div
          class="feature-card"
          @mouseover="handleHover(2)"
          @mouseout="handleLeave(2)"
        >
          <icon-park
            type="Key"
            size="60"
            fill="#4299e1"
            class="feature-icon"
          />
          <h3>5秒生成反馈</h3>
          <p class="feature-desc">AI算法支持，5秒内生成针对性面试反馈。</p>
        </div>
        <div
          class="feature-card"
          @mouseover="handleHover(3)"
          @mouseout="handleLeave(3)"
        >
          <icon-park
            type="Book"
            size="60"
            fill="#4299e1"
            class="feature-icon"
          />
          <h3>海量题库</h3>
          <p class="feature-desc">覆盖100+岗位，10万+面试真题。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconPark } from '@icon-park/vue-next/es/all';


// 表单数据
const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const activeIndex = ref(-1);
const router = useRouter();

// 登录逻辑
const handleLogin = async () => {
  // 表单验证
  if (!username.value || !password.value) {
    alert('请输入用户名和密码');
    return;
  }
  try {
    // 模拟API验证（实际项目中替换为真实API调用）
    const isValid = await verifyCredentials(username.value, password.value);

    if (isValid) {
      // 验证成功，跳转到面试界面
      await router.push('/job_info');
    } else {
      alert('用户名或密码错误');
    }
  } catch (error) {
    alert('登录失败，请重试');
    console.error('登录错误:', error);
  }
};

// 模拟验证函数（实际项目中替换为真实API）
const verifyCredentials = async (username, password) => {
  return username === 'admin' && password === '123456';
};

const handleHover = (index) => {
  activeIndex.value = index;
};

const handleLeave = () => {
  activeIndex.value = -1;
};
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  overflow: hidden;
}

/* 左侧登录表单 */
.login-left {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background-color: #f8fafc; /* 淡蓝色背景 */
}

.login-content {
  width: 100%;
  max-width: 400px;
  padding: 30px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.logo-group {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.app-name {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.welcome-message {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.form-group {
  position: relative;
  margin-bottom: 20px;
}

.input-field {
  width: 80%;
  height: 45px;
  padding: 0 15px 0 40px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.3s;
}

.input-field:focus {
  border-color: #d6ddea;
}

.input-field:focus ~ .icon {
  color: #3182ce;
  transform: translateY(-50%) scale(1.2);
}

/* 优势卡片图标动效 */
.feature-icon {
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
  transform: rotate(360deg) scale(1.2);
  filter: drop-shadow(0 0 8px rgba(58, 151, 212, 0.6));
}

.remember-forget {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  font-size: 14px;
  color: #666;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.forget-link {
  color: #1981c4;
  text-decoration: none;
}

.login-btn {
  width: 100%;
  height: 45px;
  background: #edf2f7;
  color: #a0aec0;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.login-btn:hover {
  background: #3182ce;
  color:white;
}

.register-tip {
  margin-top: 20px;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.register-link {
  color: #1981c4;
  text-decoration: none;
  font-weight: 500;
}

/* 右侧背景图 */
.features-section {
  padding-top: 40px;
  background: #dde9ea;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  grid-template-columns: repeat(2, 1fr);
  padding: 35px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-card:hover {
  transform: scale(1.05); /* 悬浮时放大 */
  background: #f0f8ff; /* 淡蓝色背景加深 */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); /* 增强阴影 */
}

.feature-desc {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  display: block;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .features-section {
    padding: 40px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>