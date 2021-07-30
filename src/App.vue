<template>
  <UI_Navbar v-if="UIGlobalNavbarState === 1"/>
  <router-view />
</template>

<script>
import UI_Navbar from '@/components/UI/Navbar/Navbar.vue'
export default {
  components: {
    UI_Navbar
  },
  computed: {
    UIGlobalNavbarState: function () {
      return this.$store.getters['uiStateModule/getGlobalNavbarState']
    }
  }
}
</script>

<style>
body {
  --ui-success-lighter: #d3e5ff;
  --ui-success-light: #3291ff;
  --ui-success: #0070f3;
  --ui-success-dark: #0761d1;
  --ui-error-lighter: #f7d4d6;
  --ui-error-light: #ff1a1a;
  --ui-error: #e00;
  --ui-error-dark: #c50000;
  --ui-warning-lighter: #ffefcf;
  --ui-warning-light: #f7b955;
  --ui-warning: #f5a623;
  --ui-warning-dark: #ab570a;
  --ui-violet-lighter: #e3d7fc;
  --ui-violet-light: #8a63d2;
  --ui-violet: #7928ca;
  --ui-violet-dark: #4c2889;
  --ui-cyan-lighter: #aaffec;
  --ui-cyan-light: #79ffe1;
  --ui-cyan: #50e3c2;
  --ui-cyan-dark: #29bc9b;
  --ui-highlight-purple: #f81ce5;
  --ui-highlight-magenta: #eb367f;
  --ui-highlight-pink: #ff0080;
  --ui-highlight-yellow: #fff500;
  --ui-foreground: #000;
  --ui-background: #fff;
  --ui-selection: var(--ui-cyan-light);
  --accents-1: #fafafa;
  --accents-2: #eaeaea;
  --accents-3: #999;
  --accents-4: #888;
  --accents-5: #666;
  --accents-6: #444;
  --accents-7: #333;
  --accents-8: #111;
  --ui-link-color: var(--ui-success);
  --ui-marketing-gray: #fafbfc;
  --ui-code: var(--ui-highlight-purple);
  --ui-secondary-lighter: var(--accents-2);
  --ui-secondary-light: var(--accents-3);
  --ui-secondary: var(--accents-5);
  --ui-secondary-dark: var(--accents-7);
  --dropdown-box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.02);
  --dropdown-triangle-stroke: #fff;
  --shadow-smallest: 0px 4px 8px rgba(0, 0, 0, 0.12);
  --shadow-small: 0 5px 10px rgba(0, 0, 0, 0.12);
  --shadow-medium: 0 8px 30px rgba(0, 0, 0, 0.12);
  --shadow-large: 0 30px 60px rgba(0, 0, 0, 0.12);
  --shadow-hover: 0 30px 60px rgba(0, 0, 0, 0.12);
  --shadow-sticky: 0 12px 10px -10px rgba(0, 0, 0, 0.12);
}
body[data-t-style="dark"] {
  --ui-foreground: #fff;
  --ui-background: #000;
  --ui-selection: var(--ui-highlight-purple);
  --accents-8: #fafafa;
  --accents-7: #eaeaea;
  --accents-6: #999;
  --accents-5: #888;
  --accents-4: #666;
  --accents-3: #444;
  --accents-2: #333;
  --accents-1: #111;
  --ui-secondary-lighter: var(--accents-2);
  --ui-secondary-light: var(--accents-3);
  --ui-secondary: var(--accents-5);
  --ui-secondary-dark: var(--accents-7);
  --ui-link-color: var(--ui-success-light);
  --ui-marketing-gray: var(--accents-1);
  --ui-code: var(--ui-cyan-light);
  --ui-error-light: #f33;
  --ui-error: red;
  --ui-error-dark: #e60000;
  --dropdown-box-shadow: 0 0 0 1px var(--accents-2);
  --dropdown-triangle-stroke: #333;
  --header-background: rgba(0, 0, 0, 0.5);
  --header-border-bottom: inset 0 -1px 0 0 hsla(0, 0%, 100%, 0.1);
  --header-import-flow-background: rgba(17, 17, 17, 0.8);
  --shadow-smallest: 0 0 0 1px var(--accents-2);
  --shadow-small: 0 0 0 1px var(--accents-2);
  --shadow-medium: 0 0 0 1px var(--accents-2);
  --shadow-large: 0 0 0 1px var(--accents-2);
  --shadow-sticky: 0 0 0 1px var(--accents-2);
  --shadow-hover: 0 0 0 1px var(--ui-foreground);
}

@import url("https://rsms.me/inter/inter.css");
html {
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Ubuntu", "Roboto", "Noto Sans", "Droid Sans", sans-serif;
}
@supports (font-variation-settings: normal) {
  html {
    font-family: "Inter var", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Ubuntu", "Roboto", "Noto Sans", "Droid Sans", sans-serif;
  }
}

body {
  background-color: var(--ui-background);
  color: var(--ui-foreground);
  margin: 0px;
  overflow: hidden;
  width: 100vw;
  height:100vh;
}

.GenericUITransition-Fade-enter-active {
  transition: opacity 0.3s ease;
}

.GenericUITransition-Fade-leave-active {
  transition: opacity 0s linear;
}

.GenericUITransition-Fade-enter-from,
.GenericUITransition-Fade-leave-to {
  opacity: 0;
}
.GenericUITransition-Fade-enter-to,
.GenericUITransition-Fade-leave-from {
  opacity: 1;
}

.w100 {
    width: 100vw;
}
.h100 {
    height: 100vh;
}

svg[viewBox="0 0 24 24"] {
    display: inline;
    height: inherit;
}
</style>
