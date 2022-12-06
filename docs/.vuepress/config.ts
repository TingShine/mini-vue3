import { defaultTheme, defineUserConfig } from "vuepress";
import { backToTopPlugin } from "@vuepress/plugin-back-to-top";
import { searchPlugin } from "@vuepress/plugin-search";

export default defineUserConfig({
  base: "/mini-vue3/",
  plugins: [backToTopPlugin(), searchPlugin()],
  lang: "zh-CN",
  title: "Mini-Vue3",
  description: "学习vue3源码，再造框架",
  theme: defaultTheme({
    repo: "https://github.com/TingShine/mini-vue3.git",
    sidebar: [
      {
        text: "介绍",
        link: "/guide",
      },
      {
        text: "响应式",
        link: "/guide/reactive",
      },
    ],
  }),
});
