import { InjectionKey } from 'vue'
import { createStore, useStore as baseUseStore, Store } from 'vuex'
import { v4 as uuidv4 } from 'uuid'
import uiStateModule from './modules/uicontroller'
import sharedStateModule from './modules/sharedState'
import encryptionStateModule from './modules/encryptioncontroller'
import {
  ApplicationGlobalState_SharedIDCacheType, ApplicationGlobalState_CurrentWindowLegacyState
} from './types/types'
import browser from 'browser-detect'
import { BrowserDetectInfo } from 'browser-detect/dist/types/browser-detect.interface'
import { QRencodeData } from '@/modules/qr'

export interface State {
  ApplicationGlobalState: {
    sharedID: string,
    sharedIDCacheState: keyof typeof ApplicationGlobalState_SharedIDCacheType,
    state: keyof typeof ApplicationGlobalState_CurrentWindowLegacyState
  },
  currentTime: number,
  browserInfo: BrowserDetectInfo | null,
  qrcodeData: string,
  qrcodeLink: string
}

export const key: InjectionKey<Store<State>> = Symbol('Vuex Store Symbol')
export const store = createStore<State>({
  state: {
    ApplicationGlobalState: {
      sharedID: '',
      sharedIDCacheState: 'Undefined',
      state: 'Recovered'
    },
    currentTime: Date.now(),
    browserInfo: null,
    qrcodeData: '',
    qrcodeLink: ''
  },
  mutations: {
    setIDState (state: State, id: string) {
      state.ApplicationGlobalState.sharedID = id
      state.ApplicationGlobalState.state = 'New'
    },
    setIDCacheState (state: State, cachestate: keyof typeof ApplicationGlobalState_SharedIDCacheType) {
      state.ApplicationGlobalState.sharedIDCacheState = cachestate
    },
    setApplicationGlobalState (state: State, newState:keyof typeof ApplicationGlobalState_CurrentWindowLegacyState) {
      state.ApplicationGlobalState.state = newState
    },
    recoverDate (state: State) {
      state.currentTime = Date.now()
      window.localStorage.setItem('lastUpdatedStatus', String(Date.now()))
    },
    setQRCodeData (state: State, data: string) {
      state.qrcodeData = data
    },
    setQRCodeLink (state: State, link: string) {
      state.qrcodeLink = link
    },
    _setBrowserInfo (state: State, obj: BrowserDetectInfo) {
      state.browserInfo = obj
    }
  },
  actions: {
    generateNewID (context) {
      context.dispatch('encryptionStateModule/generateNewEncryptionString')
      context.commit('setIDState', uuidv4())
      context.commit('setIDCacheState', ApplicationGlobalState_SharedIDCacheType.LocalGenerated)
      context.dispatch('sharedStateModule/InitaliseQuickConnect')
      QRencodeData(context.state.ApplicationGlobalState.sharedID, context.state.browserInfo, context.getters['encryptionStateModule/getEncryptionbtoa'], (data: string, link: string) => {
        context.commit('setQRCodeData', data)
        context.commit('setQRCodeLink', link)
        console.log(link)
      }, (err: number) => { alert(err) })
    },
    generateNewBrowserInfo (context) {
      context.commit('_setBrowserInfo', browser())
    },
    connectToClientSide (context, data) {
      context.commit('setIDState', data.i)
      context.commit('setIDCacheState', ApplicationGlobalState_SharedIDCacheType.RemoteGenerated)
      context.dispatch('encryptionStateModule/setEncryptionString', data.e)
      context.dispatch('sharedStateModule/InitaliseQuickConnect')
    }
  },
  modules: {
    uiStateModule,
    encryptionStateModule,
    sharedStateModule
  }
})

export function useStore () {
  return baseUseStore(key)
}
