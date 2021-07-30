import { Module } from 'vuex'
import { UIState_uiGlobalApplicationState, UIState_uiGlobalNavbarState } from '../types/types'

export interface State {
  uiGlobalApplicationState: keyof typeof UIState_uiGlobalApplicationState,
  uiGlobalNavbarState: keyof typeof UIState_uiGlobalNavbarState,
  uiGlobalLoaderState: {
    title: string,
    subTitle: string,
    shownAsTransparent: boolean
  }
}

const uiStateModule: Module<any, any> = {
  namespaced: true,
  state: <State>{
    uiGlobalApplicationState: 'Undefined',
    uiGlobalNavbarState: 'Hidden',
    uiGlobalLoaderState: {
      title: '',
      subTitle: ''
    }
  },
  mutations: {
    updateGlobalApplicationState (store, params) {
      store.uiGlobalApplicationState = params
    },
    updateGlobalNavbarState (store, params) {
      store.uiGlobalNavbarState = params
    },
    updateGlobalLoaderScreenState (store, params) {
      store.uiGlobalLoaderState.title = params[0]
      store.uiGlobalLoaderState.subTitle = params[1]
    }
  },
  getters: {
    getGlobalApplicationState (state) {
      return state.uiGlobalApplicationState
    },
    getGlobalNavbarState (state) {
      return state.uiGlobalNavbarState
    },
    getGlobalLoaderScreenState (state) {
      return state.uiGlobalLoaderState
    }
  }
}

export default uiStateModule as Module<any, any>
