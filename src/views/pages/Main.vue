<template>
  <main class="w100 h100 flex-center">
    <section class="tip">
      <h1>Connected</h1>
      <p>Drag and drop files here to send to ___</p>
      <p>Alternatively, use the button below to select files.</p>
      <button class="fileInputButton" @click="uploadFiles">Upload Files</button>
      <p>This will load your file into memory, so please be mindful of file size.</p>
    </section>
    <section>
      <section class="fileList">
        <transition-group name="list">
          <div class="fileItem" v-for="file in files" :key="file.id" v-bind:data-state="file.status" v-bind:data-progress="file.progress">
            <div class="actions" v-if="file.status == 'Ready' || file.status == 'Chunking' || file.status == 'Downloading' || file.status == 'Cancelling'">
              <button v-if="file.status == 'Ready' && file.isFullyDatarised == true && file.isUploader == false" v-on:click="DownloadFile(file.id)">
                <img :src="require(`@/assets/uiicons/fluent-arrow-download-24-regular.svg`)"/>
                Download
              </button>
              <button v-if="file.status == 'Ready'" v-on:click="DeleteFile(file.id)">
                <img :src="require(`@/assets/uiicons/fluent-delete-24-regular.svg`)"/>
                Remove
              </button>
              <button v-if="file.status == 'Downloading'" v-on:click="PauseFile(file.id)">
                <img :src="require(`@/assets/uiicons/fluent-pause-circle-24-regular.svg`)"/>
                Pause
              </button>
              <button v-if="file.status == 'Downloading'" v-on:click="StopFile(file.id)">
                <img :src="require(`@/assets/uiicons/fluent-dismiss-circle-24-regular.svg`)"/>
                Stop
              </button>
              <button v-if="file.status == 'Downloading'" v-on:click="DeleteFile(file.id)">
                <img :src="require(`@/assets/uiicons/fluent-delete-24-regular.svg`)"/>
                Remove
              </button>
              <button v-if="file.status == 'Chunking' || file.status == 'Cancelling'" v-on:click="CancelFile(file.id, file.progress)" v-bind:data-progress="file.progress">
                <div class="cancelButtonIconholder">
                  <img :src="require(`@/assets/uiicons/fluent-dismiss-circle-24-regular.svg`)" v-if="file.status === 'Chunking'"/>
                  <span v-if="file.status == 'Cancelling'" class="span1"><span class="span2"><UI_Loader type="inline"/></span></span>
                </div>
                <span v-if="file.status == 'Chunking'">Cancel</span>
                <span v-if="file.status == 'Cancelling'">Cancelling</span>
              </button>
            </div>
            <div class="icon">
              <img :src="require(`@/assets/fileicons/${file.icon}.svg`)"/>
            </div>
            <div class="info">
              <h3>{{ file.name }}</h3>
              <p>{{ file.size }}</p>
              <div class="status">
                <transition name="statusTransition">
                  <p class="status" :key="file.status">
                    {{ file.status }}
                    <span v-if="(file.status == 'Chunking' && file.progress !== -1) || (file.status =='Downloading' && file.progress !== -1)">{{ file.progress }}%</span>
                    <span v-else-if="file.status !== 'Ready' && file.progress === -1" class="elipsis">...</span>
                  </p>
                </transition>
              </div>
            </div>
            <div class="progressBackground" v-bind:data-progress="file.progress" >
              <div class="progress" v-bind:style="{ width: file.progress + '%' }" v-bind:data-progress="file.progress"></div>
            </div>
          </div>
        </transition-group>
      </section>
    </section>
  </main>
  <input id="fileItem" type="file" @change="handleFiles" multiple style="display: none;" ref="fileInput">
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import UI_Loader from '@/components/UI/Loader/Loader.vue'

export default defineComponent({
  name: 'PageView_Main',
  components: {
    UI_Loader
  },
  methods: {
    handleFiles: function (event: any) {
      const files = event.target!.files
      console.log(files)
      files.forEach((file: File, index: number) => {
        setTimeout(() => {
          this.$store.dispatch('sharedStateModule/CreateNewFile', file)
        }, 500 * index)
      })
    },
    uploadFiles: function () {
      const element: HTMLInputElement = document.querySelector('#fileItem')! as HTMLInputElement
      element.value = ''
      element.click()
    },
    DeleteFile: function (fileID: string) {
      this.$store.dispatch('sharedStateModule/DeleteCreatedFile', fileID)
    },
    CancelFile: function (fileID: string, progress: number) {
      if (progress === -1) {
        console.log('Cannot cancel from remote')
      } else {
        this.$store.commit('sharedStateModule/UpdateFileStatus', {
          fileID: fileID,
          status: 'Cancelling',
          progress: -1
        })
        this.$store.commit('sharedStateModule/RemoveWorker', fileID)
        setTimeout(() => {
          this.$store.dispatch('sharedStateModule/DeleteCreatedFile', fileID)
        }, 2500)
      }
    },
    DownloadFile: function (fileID: string) {
      this.$store.dispatch('sharedStateModule/DownloadFile', fileID)
    }
  },
  computed: {
    files: function () {
      const rev: Array<any> = []
      Object.entries(this.$store.getters['sharedStateModule/getSharedFileList']).forEach((el: [string, any]) => {
        rev.unshift({
          id: el[0],
          name: el[1].name,
          icon: el[1].icon,
          size: el[1].humansize,
          status: el[1].status,
          progress: Math.round(el[1].progress),
          isFullyDatarised: (el[1].data[0] !== undefined),
          isUploader: el[1].local
        })
      })
      return rev
    }
  }
})
</script>

<style scoped>

main {
  display: flex;
  overflow-y: auto;
  max-height: 100vh;
  align-items: center;
  flex-flow: column;
}

section {
  width: 500px;
  max-width: 90vw;
}
.tip {
  margin-top: 50px;
  margin-bottom: 20px;
  position: sticky;
  top: 0px;
  z-index: 1000;
  padding-bottom: 20px;
  background-color: #000000c7;
  backdrop-filter: brightness(0.5);
}
.tip p {
  margin: 0px;
}

button.fileInputButton {
  width: 500px;
  max-width: 90vw;
  padding: 15px 0px;
  font-family: "Inter var", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",    "Ubuntu", "Roboto", "Noto Sans", "Droid Sans", sans-serif;
  font-weight: 600;
  background-color: var(--accents-1);
  border: 1px solid var(--accents-2);
  border-radius: 5px;
  margin-top: 20px;
  margin-bottom: 20px;
  cursor: pointer;
  color:  #ffffff;
}
button.fileInputButton:hover {
  background-color: var(--accents-2)
}

.fileItem {
  background: var(--accents-1);
  border: 1px solid var(--accents-2);
  border-bottom:0px;
  border-radius: 5px 5px 0px 0px;
  margin-bottom: 25px;
  padding: 15px 0px;
  position: relative;
  height: 72px;
}

.fileItem[data-state="Loading"],
.fileItem[data-state="Chunking"][data-progress="-1"] {
  cursor: wait;
}
.fileItem[data-state="Loading"] .info,
.fileItem[data-state="Chunking"][data-progress="-1"] .info {
  opacity: 0.7;
}

.fileItem .actions {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  border-radius: 5px 5px 0px 0px;
  background-color: var(--header-background);
  z-index: 1000;
  opacity:0;
  pointer-events: none;
}
.fileItem:hover .actions,
.fileItem[data-state="Cancelling"] .actions {
  display: flex;
  opacity: 1;
  pointer-events: auto;
}

.fileItem h3 {
  margin-top: 10px;
  margin-bottom: 0px;
  max-width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.fileItem p {
    margin-top: 3px;
}

.fileItem .icon {
  width:  51px;
  height: calc(100% + 1px);
  position: absolute;
  top: -1px;
  left: -1px;
  background-color: var(--accents-2);
  border-radius: 5px 0px 0px 0px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fileItem .icon img {
  filter: invert(1);
  width: 30px;
  height: 30px;
}

.fileItem .info {
  margin-left: 65px;
  width: calc(100% - 80px);
  height: 100%;
  top: 0px;
  position: absolute;
}

@keyframes growIn {
  0% {
    height:0px;
    margin-bottom: 0px;
    padding: 0px 0px;
    transform: translateX(20px);
    opacity: 0;
  }
  70% {
    height: 72px;
    margin-bottom: 25px;
    padding: 15px 0px;
    transform: translateX(20px);
    opacity: 0;
  }
  100% {
    transform: translateX(0px);
    opacity: 1;
    height: 72px;
    margin-bottom: 25px;
  }
}
.list-enter-active {
  animation: growIn 0.5s cubic-bezier(0, 0, 0, 0.98);
}
.list-leave-active {
  animation: growIn 0.5s cubic-bezier(0, 0, 0.98, 0) reverse;
}

.fileItem .progress, .fileItem .progressBackground {
  position: absolute;
  bottom: -5px;
  left: 0px;
  height: 5px;
}
.fileItem .progress {
  background-color: var(--ui-link-color);
  left: 0px;
  bottom: 0px;
}
.fileItem .progress[data-progress="-1"] {
  width: 0% !important;
}
.fileItem .progressBackground {
  background-color: var(--accents-2);
  width: calc(100% + 2px);
  left: -1px;
  overflow: hidden;
  border-radius: 0px 0px 5px 5px;
}
.fileItem .progressBackground[data-progress="-1"] {
    background-image: linear-gradient(315deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);
    background-size: 1rem 1rem;
    background-position: 1rem;
    animation: smoothSlide 0.5s linear infinite;
}
@keyframes smoothSlide {
  from {
    background-position: 1rem;
  }
  to {
    background-position: 2rem;
  }
}

.statusTransition-enter-active,
.statusTransition-leave-active {
  transition: all 0.1s ease;
}
.statusTransition-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.statusTransition-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
.fileItem p.status {
  position: absolute;
  margin-bottom: 0px;
}
.fileItem div.status {
  position: relative;
}

.fileItem .actions button {
  margin: 10px;
  width: 100px;
  padding: 10px;
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  outline:  none;
  border-radius: 5px;
  background: #1c1c1cc7;
  color:  #ffffff;
  border: none;
  font-family: "Inter var", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",    "Ubuntu", "Roboto", "Noto Sans", "Droid Sans", sans-serif;
  cursor: pointer;
}

.fileItem .actions button img {
  filter: invert(1);
  width: 30px;
  height: 30px;
}

.fileItem .actions button:hover {
  background-color: #343434c7;
}

.fileItem .actions button[data-progress="-1"] {
  pointer-events: none;
  filter: brightness(0.5);
  background: #1c1c1cc7 !important;
}
.fileItem .actions button[data-progress="-1"]:after {
  content: "";
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  cursor: no-drop;
  pointer-events: all;
}
.actions button .cancelButtonIconholder {
  width: 30px;
  height: 30px;
  margin-bottom: 10px;
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
}
.actions .cancelButtonIconholder span.span1 {
    transform: scale(1.75);
    margin-top: 5px;
}
.actions .cancelButtonIconholder span.span2 {
    border-radius: 50%;
}
.fileItem span.elipsis {
  margin-left: -0.2rem;
}
</style>
