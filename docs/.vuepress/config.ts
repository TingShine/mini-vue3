import { defaultTheme, defineUserConfig } from "vuepress";

export default defineUserConfig({
  base: "/mini-vue3/",
  plugins: [],
  lang: "zh-CN",
  title: "Mini-Vue3",
  description: "vue3源码剖析，再造框架",
  alias: {
    
  },
  theme: defaultTheme({
    repo: "https://github.com/TingShine/mini-vue3.git",
    sidebarDepth: 3,
    sidebar:  [
      {
        text: '介绍',
        collapsible: true,
        children: [
          '/guide/readme.md',
          '/guide/about.md'
        ]
      },
        {
          text: '响应式',
          collapsible: true,
          children: [
            '/reactive/effect.md',
            '/reactive/ref.md',
            '/reactive/reactive.md',
            '/reactive/computed.md',
            '/reactive/readonly.md',
            '/reactive/shallowReadonly.md',
          ]
        }
      ]
  }),
});
