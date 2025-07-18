<template>
  <div class="register-container">
    <div class="register-box">
      <h1 class="header">注册新账号</h1>
      <form class="register-form">
        <div class="form-group">
          <label class="label">电子邮件</label>
          <input
            type="email"
            class="input"
            placeholder="admin@163.com"
            v-model="email"
          />
        </div>
        <div class="form-group">
          <label class="label">密码</label>
          <input
            type="password"
            class="input"
            placeholder="******"
            v-model="password"
          />
        </div>
        <div class="form-group agree">
          <input type="checkbox" class="checkbox" v-model="agree" />
          <label class="agree-label">同意服务条款</label>
        </div>
        <button
          type="submit"
          class="submit-btn"
          :disabled="!agree"
          @click.prevent="handleRegister"
        >
          注册
        </button>
        <p class="login-link">
          已有账号？ <router-link to="/login">登录</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

const email = ref('');
const password = ref('');
const agree = ref(false);

const handleRegister = () => {
  if (!agree.value) {
    ElMessage.error('请同意服务条款');
    return;
  }
  // 实际注册逻辑
  console.log('注册信息：', email.value, password.value);
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
}

.register-box {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.header {
  color: #2d3748;
  font-size: 28px;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.label {
  display: block;
  margin-bottom: 8px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.input {
  width: 95%;
  height: 48px;
  padding: 0 16px;
  border: 2px solid #edf2f7;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.input:focus {
  border-color: #3182ce;
  outline: none;
}

.agree {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
}

.checkbox {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  accent-color: #3182ce;
}

.agree-label {
  color: #718096;
  font-size: 14px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.submit-btn:hover {
  background: #2a69ac;
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn:disabled {
  background: #edf2f7;
  color: #a0aec0;
  cursor: not-allowed;
}

.login-link {
  margin-top: 20px;
  color: #718096;
}

.login-link a {
  color: #3182ce;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.login-link a:hover {
  color: #2a69ac;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-box {
    max-width: 90%;
    padding: 30px;
  }
}

@media (max-width: 480px) {
  .header {
    font-size: 24px;
  }
  .input,
  .submit-btn {
    height: 44px;
  }
}
</style>