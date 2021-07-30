<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { UIState_uiGlobalNavbarState } from '@/store/types/types'
export default defineComponent({
  name: 'About',
  mounted () {
    this.$store.commit('uiStateModule/updateGlobalNavbarState', UIState_uiGlobalNavbarState.Shown)
  }
})
</script>
