module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset' // Vue 项目默认预设
  ],
  plugins: [
    '@babel/plugin-transform-private-methods' // 添加这行
  ]
};