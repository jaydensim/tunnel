<template>
  <transition name="GenericUITransition-Fade" mode="out-in">
    <div v-if="UIGlobalApplicationState === 1" key="loading">
      <UI_Loader
        type="fullscreen"
        color="#ffffff"
        backgroundcolor="#000000"
      />
    </div>
    <div v-else-if="UIGlobalApplicationState === 2" key="pairing">
      <PageView_Pairing/>
    </div>
    <div v-else-if="UIGlobalApplicationState === 4" key="main">
      <PageView_Main/>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import UI_Loader from '@/components/UI/Loader/Loader.vue'
import PageView_Pairing from '@/views/pages/Pair.vue'
import PageView_Main from '@/views/pages/Main.vue'
import { UIState_uiGlobalNavbarState } from '@/store/types/types'

export default defineComponent({
  name: 'App',
  components: {
    UI_Loader,
    PageView_Pairing,
    PageView_Main
  },
  computed: {
    UIGlobalApplicationState: function () {
      return this.$store.getters['uiStateModule/getGlobalApplicationState']
    }
  },
  mounted () {
    this.$store.commit('uiStateModule/updateGlobalNavbarState', UIState_uiGlobalNavbarState.Hidden)
  }
})
</script>
