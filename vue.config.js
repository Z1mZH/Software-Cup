// vue.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true, // 继续转译所有依赖
  chainWebpack: config => {
    // 让 babel-loader 排除 pdfjs-dist
    config.module
      .rule('js')
      .exclude
        .add(/node_modules[\\/]pdfjs-dist/)
        .end()
  }
})