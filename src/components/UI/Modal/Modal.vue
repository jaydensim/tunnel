<template>
  <transition name="fade">
  <div v-show="shown" class="s">
    <div class="shadow"></div>
    <main class="modal">
      <div class="header">{{ headerText }}</div>
      <div class="body">
        <slot name="body"></slot>
      </div>
      <div class="footer">
        <slot name="footer"></slot>
      </div>
    </main>
  </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'UI_Modal',
  props: {
    headerText: String,
    shown: Boolean
  }
})
</script>

<style scoped>
main.modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 5px;
    background-color: var(--accents-1);
    display:  flex;
    flex-flow: column;
    width: 500px;
    max-width: 95vw;
}

.header {
    padding: 20px 25px;
    border-bottom: 1px solid #444;
}
.body {
    padding: 20px 25px;
}
.footer {
    padding:  20px 25px;
    border-top: 1px solid #444;
}
.shadow {
    position: fixed;
    width: 100vw;
    height: 100vh;
    top: 0vh;
    left: 0vw;
    background-color: #000000b5;
    display: block;
}

.fade-enter-active,
.fade-leave-active {
  transition: 0.2s ease;
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100vw;
  height: 100vh;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9)
}
.s {
  position: fixed;
  top: 0px;
  left: 0px;
}
</style>
