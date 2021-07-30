<template>
  <nav>
    <div>
      Tunne;
    </div>
    <div>
      <router-link to="/">Go to Tunnel</router-link>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'UI_Navbar',
  props: {
    theme: String
  }
})
</script>

<style scoped>
nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  margin: 0px auto;
  padding: 0px 4em;
  height: 60px;
  position: fixed;
  left: 0px;
  top: 0px;
  z-index: 100000;
    width: calc(100vw - 8em);
}

</style>
