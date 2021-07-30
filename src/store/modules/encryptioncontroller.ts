import { Module } from 'vuex'
import wordList from '../../modules/words'
import SHA3 from 'crypto-js/sha3'

export interface State {
  encryptionString: Array<string> | null,
  encryptionbtoa: string,
  encryptionHash: string,
  updatedAt: string
}

const encryptionStateModule: Module<any, any> = {
  namespaced: true,
  state: <State>{
    encryptionHash: '',
    encryptionString: null,
    encryptionbtoa: '',
    updatedAt: ''
  },
  mutations: {
    updateEncryptionDetails (state, WordStrings) {
      const decoded = JSON.parse(window.atob(WordStrings))
      if (decoded.strings.length === 3) {
        state.encryptionHash = SHA3(window.btoa(decoded.strings), {
          outputLength: 256
        })
        state.encryptionString = decoded
        state.encryptionbtoa = WordStrings
        state.updatedAt = decoded.generatedAt
      }
    }
  },
  actions: {
    generateNewEncryptionString (context) {
      context.commit('updateEncryptionDetails', window.btoa(JSON.stringify({
        strings: [
          wordList[helpers.getRandomInt(0, wordList.length)],
          wordList[helpers.getRandomInt(0, wordList.length)],
          wordList[helpers.getRandomInt(0, wordList.length)]
        ],
        generatedAt: Date.now()
      })))
    },
    setEncryptionString (context, seed) {
      context.commit('updateEncryptionDetails', seed)
    }
  },
  getters: {
    getEncryptionbtoa (state) {
      return state.encryptionbtoa
    }
  }
}

const helpers = {
  getRandomInt (min: number, max: number) {
    const randomBuffer = new Uint32Array(1)
    window.crypto.getRandomValues(randomBuffer)
    const randomNumber = randomBuffer[0] / (0xffffffff + 1)
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(randomNumber * (max - min + 1)) + min
  }
}

export default encryptionStateModule as Module<any, any>
