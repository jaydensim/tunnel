import { createApp, useContext } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import { store, key, useStore } from './store'
import { QRdecodeData } from '@/modules/qr'

import { ApplicationGlobalState_CurrentWindowLegacyState, UIState_uiGlobalApplicationState, CustomWindow } from '@/store/types/types'

declare let window: CustomWindow

const mixins = {
  data () {
    return {
      $store: useStore()
    }
  }
}

createApp(App).use(store, key).use(router).mixin(mixins).mount('#app')
store.dispatch('generateNewBrowserInfo')
setInterval(tick, 500)

/*
if (store.state.ApplicationGlobalState.state === 'Recovered') {
  store.commit('uiStateModule/updateGlobalApplicationState', 1)
  store.commit('uiStateModule/updateGlobalLoaderScreenState', ['Recovering Session...', 'Your session from  is being recovered.'])
} else {
  store.commit('uiStateModule/updateGlobalApplicationState', 1)
  store.commit('uiStateModule/updateGlobalLoaderScreenState', ['', ''])
} */

if (checkLocalStorage() !== 0) {
  store.commit('setApplicationGlobalState', ApplicationGlobalState_CurrentWindowLegacyState.Recovered)
  store.commit('uiStateModule/updateGlobalApplicationState', UIState_uiGlobalApplicationState.Loading)
  const mins = Math.round(checkLocalStorage())
  if (mins === 0) {
    store.commit('uiStateModule/updateGlobalLoaderScreenState', ['Recovering Session...', 'Your session is being recovered.'])
  } else if (mins === 1) {
    store.commit('uiStateModule/updateGlobalLoaderScreenState', ['Recovering Session...', 'Your session from 1 minute ago is being recovered.'])
  } else {
    store.commit('uiStateModule/updateGlobalLoaderScreenState', ['Recovering Session...', 'Your session from ' + mins + ' minutes ago is being recovered.'])
  }
  setTimeout(initApp, 2000)
} else {
  initApp()
}

function tick () {
  store.commit('recoverDate')
}

function initApp () {
  store.commit('setApplicationGlobalState', ApplicationGlobalState_CurrentWindowLegacyState.New)
  store.commit('uiStateModule/updateGlobalApplicationState', UIState_uiGlobalApplicationState.Loading)
  store.commit('uiStateModule/updateGlobalLoaderScreenState', ['', ''])
  store.dispatch('generateNewID')
  setTimeout(() => {
    store.commit('uiStateModule/updateGlobalApplicationState', UIState_uiGlobalApplicationState.Pairing)
  }, 1000)
}

function checkLocalStorage () {
  const lastTime = window.localStorage.getItem('lastUpdatedStatus')
  if (lastTime == null) {
    return 0
  } else if ((Number(store.state.currentTime) - Number(lastTime)) <= 300000) {
    return ((Number(store.state.currentTime) - Number(lastTime)) / 60000)
  } else {
    return 0
  }
}

window.tunneldebug = {
  pairdebug: (code:any) => {
    QRdecodeData(code, (data: Record<string, unknown>) => {
      store.dispatch('connectToClientSide', data)
    }, () => { alert('fail') })
  }
}
