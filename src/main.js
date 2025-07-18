import { createApp } from 'vue'
import App from './App.vue'
import router from './router'; // 确保路径正确
import axios from 'axios';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const app = createApp(App)
app.use(ElementPlus);
app.config.globalProperties.$axios = axios;
app.provide('$axios', axios);
app.use(router)
app.mount('#app');
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}