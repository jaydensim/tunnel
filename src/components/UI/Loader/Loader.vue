<template>
    <div v-bind:data-state="type">
      <svg
        viewBox="0 0 742 742"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        v-bind:data-spin="spin"
      >
        <path fill-rule="evenodd" clip-rule="evenodd" d="M742 371C742 575.898 575.898 742 371 742C166.102 742 0 575.898 0 371C0 166.102 166.102 0 371 0V58C198.135 58 58 198.135 58 371C58 543.865 198.135 684 371 684C543.865 684 684 543.865 684 371C684 280.087 645.24 198.226 583.343 141.043L622.69 98.4308C623.183 98.8853 623.674 99.3417 624.164 99.7985C624.182 99.8158 624.201 99.8336 624.22 99.851C696.695 167.563 742 263.99 742 371Z" v-bind:fill="color"/>
      </svg>
      <div class="textfullscreen" v-if="title !== null && type !== 'inline'">
        <h1>{{ metadata.title }}</h1>
        <p>{{ metadata.subTitle }}</p>
      </div>
    </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'UI_Loader',
  props: {
    type: {
      validator (value: string) {
        return ['inline', 'overlay', 'fullscreen'].includes(value)
      }
    },
    color: { type: String, default: '#ffffff' },
    backgroundcolor: { type: String, default: '#33333350' },
    spin: { type: Boolean, default: true }
  },
  computed: {
    metadata () {
      return this.$store.getters['uiStateModule/getGlobalLoaderScreenState']
    }
  }
})
</script>

<style scoped>
@keyframes Anim_spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

div svg[data-spin="true"] path {
  animation: Anim_spin 0.8s linear infinite backwards;
  transform-origin: center;
}
div[data-state="inline"] {
  display: inline-block;
  width: 1em;
  height: 1em;
}
div[data-state="fullscreen"] {
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100vw;
  height: 100%;
  background-color: v-bind(backgroundcolor);
  z-index: 100;
}
div[data-state="fullscreen"] svg,
div[data-state="overlay"] svg {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  transform: translate(-50%, -150%);
  overflow: hidden;
  border-radius: 50%;
}
div[data-state="overlay"] {
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100vw;
  height: 100%;
  background-color: #000000aa;
  z-index: 100;
}

.textfullscreen {
  position: fixed;
  top: 50%;
  left: 0px;
  width: 100%;
  text-align: center;
}
</style>
