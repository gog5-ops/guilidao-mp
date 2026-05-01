import { defineConfig } from "@tarojs/cli";

export default defineConfig({
  projectName: "guilidao-mp",
  date: "2026-05-01",
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: "src",
  outputRoot: "dist",
  plugins: ["@tarojs/plugin-framework-react"],
  defineConstants: {},
  copy: { patterns: [], options: {} },
  framework: "react",
  compiler: "webpack5",
  mini: {
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: {
        enable: false,
        config: {
          namingPattern: "module",
          generateScopedName: "[name]__[local]___[hash:base64:5]",
        },
      },
    },
  },
  h5: {
    publicPath: "/",
    staticDirectory: "static",
    esnextModules: ["@tarojs/components"],
    devServer: {
      port: 8090,
      host: "0.0.0.0",
    },
    postcss: {
      autoprefixer: { enable: true, config: {} },
      cssModules: {
        enable: false,
        config: {
          namingPattern: "module",
          generateScopedName: "[name]__[local]___[hash:base64:5]",
        },
      },
    },
  },
});
