import { defaultTheme, defineUserConfig } from "vuepress";

export default defineUserConfig({
  base: "/mini-vue3/",
  lang: "zh-CN",
  title: "Mini-Vue3",
  description: "学习vue3源码，再造框架",
  theme: defaultTheme({
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
