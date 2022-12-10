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
    sidebarDepth: 3,
    sidebar:  [
      {
        text: '介绍',
        collapsible: true,
        children: [
          '/guide/readme.md'
        ]
      },
        {
          text: '响应式',
          collapsible: true,
          children: [
            '/reactive/ref.md',
            '/reactive/reactive.md'
          ]
        }
      ]
  }),
});
