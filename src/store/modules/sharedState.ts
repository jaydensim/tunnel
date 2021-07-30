import { Module } from 'vuex'
import {
  UIState_uiGlobalApplicationState, ApplicationGlobalState_CurrentWindowLegacyState, SharedStatehandler_FileState, SharedStatehandler_DCSIGMSGTYPE
} from '../types/types'
import { humanFileSize, mapProgress } from '@/modules/fileHelpers'
import { MatchIcon } from '@/modules/icons'

import { binaryStringToBlob } from 'blob-util'
import { v4 as uuidv4 } from 'uuid'
import { algo, enc, Rabbit, MD5 } from 'crypto-js'
import quickconnect from 'primus-only-rtc-quickconnect'
import freeice from 'freeice'

export interface FileSlice {
  id: string,
  sliceID: string,
  slice: Blob
}

export interface State {
  quickConnect: {
    qc: any,
    qc_sig: any,
    qc_data: any
  },
  q: {
    dispatch: any,
    ingest: {
      process: any,
      dc_sig: any,
      dc_data: any
    }
  },
  sharedFileHandler: {
    files: {
      [index: string]: {
        name: string,
        type: string,
        icon: string,
        size: number,
        humansize: string,
        hash: string,
        data: Array<string|null>,
        slices: Array<FileSlice>,
        totalchunks: number,
        status: keyof typeof SharedStatehandler_FileState,
        progress: number,
        local: boolean
      }
    } | null
  },
  DataChannelQueue: Array<FileSlice>,
  queues: {
    dc_sig: Array<string>,
    dc_data: Array<string>,
    dispatcher: {
      process: any,
      bypass: any,
      locks: {
        sig: boolean,
        data: boolean
      },
      ackLocks: {
        [key: string]: string
      }
    }
  },
  workers: {
    [key: string]: any
  }
}

const sharedStateModule: Module<any, any> = {
  namespaced: true,
  state: <State>{
    quickConnect: {
      qc: undefined,
      qc_sig: undefined,
      qc_data: undefined
    },
    q: {
      dispatch: undefined,
      ingest: {
        process: undefined,
        dc_sig: undefined,
        dc_data: undefined
      }
    },
    sharedFileHandler: {
      files: {}
    },
    DataChannelQueue: [],
    queues: {
      dc_sig: [],
      dc_data: [],
      dispatcher: {
        process: undefined,
        bypass: undefined,
        locks: {
          sig: false,
          data: false
        },
        ackLocks: {
          acksig: '',
          ackdata: ''
        }
      }
    },
    workers: {}
  },
  mutations: {
    CreateNewQuickConnect: function (state: State, q: { qc: any, sig: any, data: any }) {
      state.quickConnect.qc = q.qc
      state.quickConnect.qc_sig = q.sig
      state.quickConnect.qc_data = q.data
      state.sharedFileHandler.files = {}
      state.DataChannelQueue = []
    },
    FixQCFunctionState: function (state: State, fix: { item: string, data: unknown }) {
      if (fix.item === 'qc_sig') {
        state.quickConnect.qc_sig = fix.data
      } else if (fix.item === 'qc.data') {
        state.quickConnect.qc_data = fix.data
      }
    },
    CreateQcontroller: function (state: State, newQ: { dispatch: any, ingest: any, queueDispatcher: any }) {
      state.q.dispatch = newQ.dispatch
      state.q.ingest.process = newQ.ingest
      const dispatchers = newQ.queueDispatcher()
      state.queues.dispatcher.process = dispatchers.process
      state.queues.dispatcher.bypass = dispatchers.bypass
    },
    CreateQIngest: function (state: State, newQ: { sig: any, data: any }) {
      state.q.ingest.dc_sig = newQ.sig
      state.q.ingest.dc_data = newQ.data
    },
    SetACKpacket: function (state: State, ack: { channel: any, ack: string }) {
      state.queues.dispatcher.ackLocks[ack.channel] = ack.ack
    },
    CreateNewFile: function (state: State, fileDetails: {id: string, hash: string, totalChunks: number, data: any}) {
      const fileid = fileDetails.id
      if (state.sharedFileHandler.files![fileid]) {
        state.sharedFileHandler.files![fileid].hash = fileDetails.hash
        state.sharedFileHandler.files![fileid].totalchunks = fileDetails.totalChunks
        if (fileDetails.data[0]) {
          state.sharedFileHandler.files![fileid].data = fileDetails.data
        } else {
          console.log('attempt to clear filedata blocked')
        }
      } else {
        console.log('Error! Canot update file details for ' + fileid)
      }
      return state.sharedFileHandler.files![fileid]
    },
    SetWorker: function (state: State, worker: { id: string, worker: any }) {
      state.workers[worker.id] = worker.worker
    },
    RemoveWorker: function (state: State, worker: string) {
      try {
        state.workers[worker].terminate()
      } catch {
        console.log('Worker already deleted.')
      } finally {
        delete state.workers[worker]
      }
    },
    RemoveFile: function (state: State, fileID: string) {
      // force igore this cause we want the object to be garbage collected
      // @ts-ignore
      state.sharedFileHandler.files![fileID] = null
      delete state.sharedFileHandler.files![fileID]
    },
    SkeletonFile: function (state: State, fileDetails: {id: string, name: string, type: string, size: number}) {
      const fileid = fileDetails.id
      state.sharedFileHandler.files![fileid] = {
        name: fileDetails.name,
        type: fileDetails.type,
        icon: MatchIcon(fileDetails.type),
        size: fileDetails.size,
        humansize: humanFileSize(fileDetails.size),
        hash: '',
        data: [],
        slices: [],
        totalchunks: 0,
        status: 'Loading',
        progress: -1,
        local: false
      }
      return state.sharedFileHandler.files![fileid]
    },
    PushChunk: function (state: State, chunk: FileSlice) {
      state.sharedFileHandler.files![chunk.id].slices.push(chunk)
      if (state.sharedFileHandler.files![chunk.id].slices.length === state.sharedFileHandler.files![chunk.id].totalchunks) {
        state.sharedFileHandler.files![chunk.id].status = 'Ready'
        state.sharedFileHandler.files![chunk.id].progress = 100
        state.q.dispatch('dc_sig', SharedStatehandler_DCSIGMSGTYPE.UpdateFileData, {
          id: chunk.id,
          hash: state.sharedFileHandler.files![chunk.id].hash,
          totalChunks: state.sharedFileHandler.files![chunk.id].totalchunks,
          data: state.sharedFileHandler.files![chunk.id].data
        })
        state.q.dispatch('dc_sig', SharedStatehandler_DCSIGMSGTYPE.UpdateFileStatus, {
          id: chunk.id,
          progress: 100,
          status: 'Ready'
        })
      } else {
        state.sharedFileHandler.files![chunk.id].status = 'Chunking'
        state.sharedFileHandler.files![chunk.id].progress = mapProgress(state.sharedFileHandler.files![chunk.id].slices.length, state.sharedFileHandler.files![chunk.id].totalchunks)
      }
    },
    UpdateFileStatus: function (state: State, statusInfo: { fileID: string, status: keyof typeof SharedStatehandler_FileState, progress: number }) {
      console.log('Updating status for file ', statusInfo.fileID)
      if (state.sharedFileHandler.files![statusInfo.fileID]) {
        state.sharedFileHandler.files![statusInfo.fileID].status = statusInfo.status as keyof typeof SharedStatehandler_FileState
        state.sharedFileHandler.files![statusInfo.fileID].progress = statusInfo.progress
      } else {
        console.log('Failed to set status for file ' + statusInfo.fileID)
      }
    },
    SetLocalFileStatus: function (state: State, fileID: string) {
      state.sharedFileHandler.files![fileID].local = true
    }
  },
  actions: {
    InitaliseQuickConnect: function (context, browserInfo) {
      context.dispatch('CloseQuickConnect')
      console.log('initalising Quickconnect')
      let dc_sig = null as any
      let dc_data = null as any
      let tried = 0
      const TryforQC = () => {
        return (qc !== null && dc_sig !== null && dc_data !== null && tried === 0)
      }
      const qc = quickconnect('https://tunnel-ws.herokuapp.com', {
        ns: 'TUNNELAPP_SESSION',
        room: context.rootState.ApplicationGlobalState.sharedID,
        manualJoin: true,
        debug: true
      }).createDataChannel('SIG').createDataChannel('DAT').createDataChannel('KAL').profile({
        b: context.rootState.browserInfo!.name,
        o: context.rootState.browserInfo!.os,
        m: context.rootState.browserInfo!.mobile
      }).on('channel:opened:SIG', function (id: any, dc: any) {
        dc_sig = dc
        dc.onmessage = function (evt: any) {
          console.log('DC_SIG ' + id + ': ' + evt.data)
          context.state.q.ingest.process('dc_sig', evt.data)
        }
        console.log('channel SIG opened for peer: ' + id)
        if (tried === 0) {
          context.commit('uiStateModule/updateGlobalApplicationState', UIState_uiGlobalApplicationState.Loading, { root: true })
          context.commit('uiStateModule/updateGlobalLoaderScreenState', ['Connecting...', 'SIG opened'], { root: true })
        }
        if (TryforQC()) {
          context.dispatch('QCExists', { qc: qc, qsig: dc_sig, qdata: dc_data })
          tried = 1
        }
        context.commit('FixQCFunctionState', {
          item: 'qc_sig',
          data: dc
        })
      }).on('channel:opened:DAT', function (id: any, dc: any) {
        dc_data = dc
        dc.onmessage = function (evt: any) {
          console.log('DC_DAT ' + id + ': ' + evt.data)
          context.state.q.ingest.process('dc_sig', evt.data)
        }
        console.log('channel DAT opened for peer: ' + id)
        if (tried === 0) {
          context.commit('uiStateModule/updateGlobalApplicationState', UIState_uiGlobalApplicationState.Loading, { root: true })
          context.commit('uiStateModule/updateGlobalLoaderScreenState', ['Connecting...', 'DAT opened'], { root: true })
        }
        if (TryforQC()) {
          context.dispatch('QCExists', { qc: qc, qsig: dc_sig, qdata: dc_data })
          tried = 1
        }
        context.commit('FixQCFunctionState', {
          item: 'qc_data',
          data: dc
        })
      }).on('channel:opened:KAL', function (id: any, dc: any) {
        dc_data = dc
        dc.onmessage = function (evt: any) {
          dc.send('KAL')
        }
        dc.send('KAL')
        console.log('channel KAL opened for peer: ' + id)
      }).on('peer:couple', (id: any, peerconnection: any, data: any, monitor: any) => {
        console.log(id, peerconnection, data, monitor)
        if (tried === 0) {
          context.commit('uiStateModule/updateGlobalApplicationState', UIState_uiGlobalApplicationState.Loading, { root: true })
          context.commit('uiStateModule/updateGlobalLoaderScreenState', ['Connecting...', 'Coupled. Waiting for DCOPEN'], { root: true })
        }
        if (TryforQC()) {
          context.dispatch('QCExists', { qc: qc, qsig: dc_sig, qdata: dc_data })
          tried = 1
        }
      })
      qc.join()
      console.log('Quickconnect done')
    },
    QCExists: function (context, quickconnect: { qc: any, qsig: any, qdata: any }) {
      console.log(quickconnect)
      context.commit('setApplicationGlobalState', ApplicationGlobalState_CurrentWindowLegacyState.New, { root: true })
      context.commit('uiStateModule/updateGlobalApplicationState', UIState_uiGlobalApplicationState.Operational, { root: true })
      context.commit('CreateNewQuickConnect', {
        qc: quickconnect.qc,
        sig: quickconnect.qsig,
        data: quickconnect.qdata
      })
      context.dispatch('CreateQdispatchFunctions')
      console.log('tried - done')
    },
    CloseQuickConnect: function (context) {
      if (context.state.quickConnect.qc !== null && context.state.quickConnect.qc !== undefined) {
        context.state.quickConnect.qc.close()
      }
      context.commit('CreateNewQuickConnect', {
        qc: null,
        sig: null,
        data: null
      })
    },
    CreateNewFile: function (context, file: File) {
      // const worker = new Worker(require('../../modules/fileloader.worker.js'))
      const worker = new Worker(fn2workerURL(fileChunkWorker))
      console.log('Worker', worker)
      const fileID = uuidv4()
      context.commit('SetWorker', {
        id: fileID,
        worker: worker
      })
      context.commit('SkeletonFile', {
        id: fileID,
        name: file.name,
        type: file.type,
        size: file.size
      })
      context.state.q.dispatch('dc_sig', SharedStatehandler_DCSIGMSGTYPE.NewSkeletonFile, {
        id: fileID,
        name: file.name,
        type: file.type,
        size: file.size
      })
      const sha256 = algo.SHA256.create()
      const data = [] as any
      worker.onmessage = (event: any) => {
        if (event.data.type === 1) {
          context.commit('CreateNewFile', {
            id: fileID,
            hash: '',
            totalChunks: event.data.length,
            data: {}
          })
        } else if (event.data.type === 2) {
          const chunkUUID = uuidv4()
          const chunk = <FileSlice>{
            id: fileID,
            sliceID: chunkUUID,
            slice: event.data.chunk
          }
          sha256.update(event.data.chunk)
          data.push(chunkUUID)
          context.commit('PushChunk', chunk)
          context.commit('SetLocalFileStatus', fileID)
        } else if (event.data.type === 3) {
          const hashfinalised = sha256.finalize().toString(enc.Hex)
          console.log(hashfinalised)
          context.commit('CreateNewFile', {
            id: fileID,
            hash: hashfinalised,
            totalChunks: event.data.num,
            data: data
          })
          context.state.q.dispatch('dc_sig', SharedStatehandler_DCSIGMSGTYPE.UpdateFileData, {
            id: fileID,
            hash: hashfinalised,
            totalChunks: event.data.num,
            data: data
          })
          setTimeout(() => {
            worker.terminate()
            context.commit('RemoveWorker', fileID)
          }, 5000)
        }
      }
      setTimeout(() => {
        worker.postMessage(file)
      }, 2000)
    },
    DeleteCreatedFile: function (context, fileID: string) {
      context.commit('RemoveFile', fileID)
      context.state.q.dispatch('dc_sig', SharedStatehandler_DCSIGMSGTYPE.DeleteFile, {
        id: fileID
      })
    },
    DownloadFile: function (context, fileID: string) {
      const worker = new Worker(fn2workerURL(fileDownloadWorker))
      console.log('Attempting to recieve chunks for file ' + fileID)
      context.commit('UpdateFileStatus', {
        fileID: fileID,
        progress: -1,
        status: 'Requesting Download'
      })
      console.log('Worker', worker)
      context.commit('SetWorker', {
        id: 'downloader' + fileID,
        worker: worker
      })
      worker.onmessage = (event: any) => {
        console.log(event)
        if (event.data.type === 56) {
          context.state.q.dispatch('dc_sig', SharedStatehandler_DCSIGMSGTYPE.RequestForFileChunk, {
            id: fileID,
            sliceID: event.data.chunk
          })
        } else if (event.data.type === 57) {
          const file = binaryStringToBlob(event.data.file)
          context.commit('UpdateFileStatus', {
            fileID: fileID,
            progress: -1,
            status: 'Processing'
          })
          worker.terminate()
          context.commit('RemoveWorker', fileID)
          context.commit('UpdateFileStatus', {
            fileID: fileID,
            progress: 100,
            status: 'Ready'
          })
          saveData(file, context.state.sharedFileHandler.files[fileID].name)
        } else if (event.data.type === 29) {
          context.commit('UpdateFileStatus', {
            fileID: fileID,
            progress: mapProgress(event.data.progress, event.data.num),
            status: 'Downloading'
          })
        } else if (event.data.type === 58) {
          console.log('error', event.data.error)
        }
      }
      setTimeout(() => {
        worker.postMessage({
          type: 0,
          fileID: fileID,
          data: JSON.parse(JSON.stringify(context.state.sharedFileHandler.files[fileID].data))
        })
      }, 2000)
    },
    CreateQdispatchFunctions: function (context) {
      /*
      context.state.q.dispatch('dc_sig', UpdateFileStatus)
      */
      const encryptionHash = window.btoa(JSON.stringify(context.rootState.encryptionStateModule.encryptionHash.words))
      console.log('Creating Q Dispatch functions with encryption hash\n' + encryptionHash + '\n\nPlease ensure that the two strings are the same')
      context.commit('CreateQcontroller', {
        dispatch: (channel: 'dc_sig' | 'dc_data', type: keyof typeof SharedStatehandler_DCSIGMSGTYPE, data: Record<string, unknown>, bypass?: boolean) => {
          const encryptedString = Rabbit.encrypt(window.btoa(JSON.stringify({ q: type, w: data })), encryptionHash).toString()
          const md5hash = MD5(encryptedString).toString()
          const packet = md5hash + '::' + encryptedString
          if (bypass) {
            context.state.queues.dispatcher.bypass(channel, packet, bypass).then((tries: any) => {
              console.log('Resolved in ' + tries + ' tries')
              console.log('Next item handler will be processed upon \'ACK\' from reciever')
              context.commit('SetACKpacket', { channel: 'sig', ack: md5hash })
            }, (err: any) => {
              console.error(err)
            })
          } else {
            context.state.queues[channel].push(packet)
            context.state.queues.dispatcher.process(channel)
          }
        },
        ingest: (channel: 'dc_sig' | 'dc_data', data: string) => {
          const hashedddata = data.split('::')
          if (hashedddata[0] === MD5(hashedddata[1]).toString()) {
            console.log('Initiating decrypt of packet \n STRING: ' + hashedddata[1] + '\nCODE:   ' + encryptionHash)
            const decryptedString = Rabbit.decrypt(hashedddata[1], encryptionHash)
            console.log(decryptedString)
            const decryptedObj = JSON.parse(window.atob(decryptedToString(decryptedString.toString())))
            if (decryptedObj.q === SharedStatehandler_DCSIGMSGTYPE.ACK) {
              context.state.q.ingest[channel](decryptedObj)
            } else {
              context.state.q.ingest[channel](decryptedObj)
              setTimeout(() => {
                context.state.q.dispatch('dc_sig', SharedStatehandler_DCSIGMSGTYPE.ACK, {
                  id: hashedddata[0]
                }, true)
              }, 200)
            }
          } else {
            console.warn('Invalid packet hash. Discarding packet.')
          }
        },
        queueDispatcher: () => {
          const processPacket = (channel: 'dc_sig' | 'dc_data', packet: string, bypass?: boolean) => {
            const bypasser = bypass || false
            return new Promise((resolve, reject) => {
              let retrier = null as any
              let times = 0
              let lock = 0
              retrier = () => {
                if (context.state.queues.dispatcher.locks[channel] && bypasser === false) {
                  if (lock >= 100) {
                    console.error('Failed to unlock channel in a timely fasion. Max lock retries exceeded.\nChannel will be forcefully unlocked.')
                    reject(new Error('Failed to unlock channel in a timely fasion. Max lock retries exceeded'))
                  } else {
                    console.log('Channel locked. - bypasser ' + bypasser)
                    lock += 1
                    setTimeout(retrier, 300)
                  }
                } else {
                  try {
                    context.state.quickConnect[{ dc_sig: 'qc_sig', dc_data: 'qc_dat' }[channel]].send(packet)
                    resolve(times)
                  } catch (err: any) {
                    if (times >= 750) {
                      console.error('Failed to send packet. Max retries exceeded')
                      reject(new Error('Failed to send packet. Max retries exceeded'))
                    } else {
                      console.log('Failed to send packet, retrying in 300ms.')
                      times++
                      setTimeout(retrier, 100)
                    }
                  }
                }
              }
              retrier()
            })
          }
          const task = {
            dc_sig: 0,
            dc_data: 0
          }
          const processArray = (channel: 'dc_sig' | 'dc_data') => {
            if (task[channel] === 0 || task[channel] === 1 || context.state.queues[channel].length === 0) {
              task[channel] = 1
              if (context.state.queues[channel].length !== 0) {
                console.log('Processing ' + context.state.queues[channel].length + ' queue items from ' + channel)
                console.log('Processing Queue: ', context.state.queues[channel])
                const packet = context.state.queues[channel].shift()
                context.state.queues[channel].unshift(packet)
                console.log('Processing item ' + packet.split('::')[0])
                processPacket(channel, packet).then((tries) => {
                  console.log('Resolved item ' + packet.split('::')[0])
                  context.commit('SetACKpacket', { channel: 'sig', ack: packet.split('::')[0] })
                  console.log('Next item handler will be processed upon \'ACK\' from reciever')
                  context.state.queues.dispatcher.locks.dc_sig = true
                  task[channel] = 0
                }, (err) => {
                  console.error(err)
                })
              } else {
                console.log('Queue empty')
                task[channel] = 0
              }
            } else {
              console.log('Called multiple times.')
            }
          }
          return {
            process: processArray,
            bypass: processPacket
          }
        }
      })
      context.commit('CreateQIngest', {
        sig: (data: any) => {
          console.log(data)
          switch (data.q) {
            case SharedStatehandler_DCSIGMSGTYPE.ACK:
              console.log('ACK RECIEVED for REMOTE packet: ' + data.w.id)
              console.log('ACK item from LOCAL packet    : ' + context.state.queues.dispatcher.locks.acksig)
              if (data.w.id === context.state.queues.dispatcher.ackLocks.sig || data.w.id === context.state.queues.dc_sig[0].split('::')[0]) {
                context.state.queues.dc_sig.shift()
                context.state.queues.dispatcher.locks.dc_sig = false
                context.state.queues.dispatcher.process('dc_sig')
              } else {
                console.log('ACK INVALIDATED - CHANNEL LOCKED')
              }
              break
            case SharedStatehandler_DCSIGMSGTYPE.DeleteFile:
              context.commit('RemoveFile', data.w.id)
              break
            case SharedStatehandler_DCSIGMSGTYPE.NewSkeletonFile:
              console.log('DC_SIG 1 0')
              context.commit('SkeletonFile', {
                id: data.w.id,
                name: data.w.name,
                type: data.w.type,
                size: data.w.size
              })
              context.commit('UpdateFileStatus', {
                fileID: data.w.id,
                progress: -1,
                status: 'Chunking'
              })
              break
            case SharedStatehandler_DCSIGMSGTYPE.UpdateFileStatus:
              console.log('DC_SIG 11')
              context.commit('UpdateFileStatus', {
                fileID: data.w.id,
                progress: data.w.progress,
                status: data.w.status
              })
              break
            case SharedStatehandler_DCSIGMSGTYPE.UpdateFileData:
              console.log('DC_SIG 12')
              context.commit('CreateNewFile', {
                id: data.w.id,
                hash: data.w.hash,
                totalChunks: data.w.totalChunks,
                data: data.w.data
              })
              context.commit('UpdateFileStatus', {
                fileID: data.w.id,
                progress: 100,
                status: 'Ready'
              })
              break
            case SharedStatehandler_DCSIGMSGTYPE.RequestForFileChunk: {
              console.log('DC_SIG 22', [...context.state.sharedFileHandler.files[data.w.id].slices])
              const chunk = [...context.state.sharedFileHandler.files[data.w.id].slices].find(({ sliceID }: FileSlice) => sliceID === data.w.sliceID)
              console.log('Sending chunk', chunk)
              context.state.q.dispatch('dc_sig', SharedStatehandler_DCSIGMSGTYPE.FileChunk, {
                type: 5,
                chunk: chunk
              })
              break
            }
            case SharedStatehandler_DCSIGMSGTYPE.FileChunk: {
              console.log(data.w.chunk)
              const chunk = data.w.chunk
              console.log('DC_SIG 23', context.state.workers['downloader' + chunk.id])
              context.state.workers['downloader' + chunk.id].postMessage({
                type: 5,
                chunk: chunk
              })
              break
            }
            default:
              console.log('DC_SIG UNKNOWN')
          }
        },
        data: (data: any) => {
          console.log('DC_DAT unknown')
        }
      })
    }
  },
  getters: {
    getSharedFileList (state) {
      return state.sharedFileHandler.files
    }
  }
}

function decryptedToString (decrypt: any) {
  const chars = []
  const decryptedArr = decrypt.toString().split('')
  while (decryptedArr.length !== 0) {
    chars.push(String.fromCharCode(parseInt(decryptedArr.splice(0, 2).join(''), 16)))
  }
  return chars.join('')
}

function fn2workerURL (fn: any) {
  const blob = new Blob(['(' + fn.toString() + ')()'], { type: 'text/javascript' })
  return URL.createObjectURL(blob)
}

function fileChunkWorker () {
  const createChunks = (file: any, cSize: number /* cSize should be byte 1024*1 = 1KB */) => {
    let startPointer = 0
    const endPointer = file.size
    const chunks = []
    while (startPointer < endPointer) {
      const newStartPointer = startPointer + cSize
      chunks.push(file.slice(startPointer, newStartPointer))
      startPointer = newStartPointer
    }
    return chunks
  }
  onmessage = (e: any) => {
    const file = e.data
    const chunks = createChunks(file, 1024 * 1)
    setTimeout(() => {
      postMessage({
        type: 1,
        length: chunks.length
      })
      chunks.forEach((chunk, index) => {
        setTimeout(() => {
          let reader = new FileReader() as any
          reader.onload = function () {
            postMessage({
              type: 2,
              chunk: btoa(reader.result),
              num: index
            })
            if (index === (chunks.length - 1)) {
              postMessage({
                type: 3,
                num: chunks.length
              })
              console.log('Finished')
            }
            chunk = 'p'
            reader = null
          }
          reader.readAsBinaryString(chunk)
        }, ((3 * index) + (chunks.length / 750)))
      })
    }, 5000)
  }
}

function fileDownloadWorker () {
  const chunks: Array<FileSlice> = []
  let data: Array<string> = []
  let state = 0
  let paused = false
  let fileID = ''
  let manualtimeout: any = null
  let file = ''
  setInterval(() => {
    if (paused === false) {
      if (state === 10) {
        if (chunks.length === data.length) {
          console.log('assembled')
          postMessage({
            type: 57,
            file: file
          })
          state = 15
        } else {
          console.log(chunks.length + '/' + data.length + 'Attempting to ask for chunk')
          postMessage({
            type: 29,
            progress: chunks.length,
            num: data.length
          })
          postMessage({
            type: 56,
            chunk: data[chunks.length]
          })
          manualtimeout = setTimeout(() => {
            state = 10
            console.log('Manual timeout')
          }, 5000)
          state = 11
        }
      }
    }
  }, 100)
  onmessage = (e: any) => {
    switch (e.data.type) {
      case 0:
        // Page has requested a download
        console.log('requested download')
        console.log('Requested download for file ' + e.data.fileID + ' with ' + e.data.data.length + 'chunks')
        data = e.data.data
        fileID = e.data.fileID
        console.log(data)
        setTimeout(() => {
          state = 10
        }, 1000)
        break
      case 1:
        // Page has paused the operation
        console.log('paused download')
        paused = true
        break
      case 2:
        // Page has resumed the operation
        console.log('resumed download')
        paused = false
        break
      case 5:
        // Page has chunk to process
        console.log('passed chunk')
        if (e.data.chunk.sliceID === data[chunks.length] && e.data.chunk.id) {
          clearTimeout(manualtimeout)
          state = 10
          chunks.push(e.data.chunk.slice)
          file += atob(e.data.chunk.slice)
        } else {
          console.log('incorrect chunk', e.data)
        }
        break
    }
  }
}

const saveData = (function () {
  const a = document.createElement('a')
  document.body.appendChild(a)
  a.style.display = 'none'
  return function (data: any, fileName: string) {
    const json = JSON.stringify(data)
    const url = window.URL.createObjectURL(data)
    a.href = url
    a.download = fileName
    a.click()
    window.URL.revokeObjectURL(url)
  }
}())

export default sharedStateModule as Module<any, any>
// K/TAC spectre lookin good
