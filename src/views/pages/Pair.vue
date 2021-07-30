<template>
  <main v-on:scroll.passive="onScroll">
    <section class="pairingScreen-qrcode-scan w100 h100 flex-center" v-show="mobile == true">
      <h1>Pair your device</h1>
      <p>Scan the code on your other device</p>
      <figure>
        <video class="vm-video" v-show="enabled == true"></video>
        <canvas class="vm-canvas" v-show="enabled == false"></canvas>
      </figure>
    </section>
    <section class="pairingScreen-qrcode-display w100 h100 flex-center">
      <h1>Pair your device</h1>
      <p>Scan the code with your other device</p>

      <figure>
        <img v-bind:src="svgSrc"/>
      </figure>

      <p>or</p>

      <div class="buttonrow">
        <button class="buttonrow buttons" v-on:click="toggleModal(true)">Get Link</button>
      </div>
    </section>
  </main>
  <div class="scrollElement" v-bind:isScrolling="isScrolling" v-show="mobile == true">
    <span v-on:click="scrolltoQRDisplay"></span>
    <span v-on:click="scrolltoQRPair"></span>
    <span></span>
  </div>
  <div v-show="isLoading === true">
    <UI_Loader type="overlay" />
  </div>
  <UI_Modal v-bind:shown="showPairingURL" headerText="Pairing Link">
    <template v-slot:body>
      <p>Use the link below to pair your other device</p>
      <p class="pairinglink"> {{pairingLink}} </p>
    </template>
    <template v-slot:footer>
      <div class="modalButtons">
        <button class="buttonrow buttons" v-on:click="copyLink()">{{coyLinktext}}</button>
        <span class="modalrspacer"></span>
        <button class="buttonrow buttons" v-on:click="toggleModal(false)">Close</button>
      </div>
    </template>
  </UI_Modal>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import UI_Loader from '@/components/UI/Loader/Loader.vue'
import UI_Modal from '@/components/UI/Modal/Modal.vue'
import jsQR from 'jsqr'
import { errors } from '@/modules/errors'
import { QRdecodeData } from '@/modules/qr'

export default defineComponent({
  name: 'PageView_Pairing',
  components: {
    UI_Loader,
    UI_Modal
  },
  data: function () {
    return {
      mobile: this.$store.state.browserInfo?.mobile, // desktop debug - insert "true || " before this.$store
      svgSrc: 'data:image/svg+xml,' + escape(this.$store.state.qrcodeData),
      scrollPos: 0,
      isScrolling: false,
      QRvideo: null as HTMLVideoElement | null,
      QRcanvas: null as HTMLCanvasElement | null, // document.createElement('canvas')
      QRcontext: null as CanvasRenderingContext2D | null,
      enabled: false,
      isLoading: true,
      isScanning: true,
      pairingLink: this.$store.state.qrcodeLink,
      showPairingURL: false,
      coyLinktext: 'Copy Link'
    }
  },
  methods: {
    toggleModal: function (state: boolean) {
      this.coyLinktext = 'Copy Link'
      this.showPairingURL = state
    },
    copyLink: function (state: boolean) {
      navigator.clipboard.writeText(this.pairingLink).then(() => {
        this.coyLinktext = 'Copied!'
        setTimeout(() => {
          this.coyLinktext = 'Copy Link'
        }, 1500)
      }, (err) => {
        this.coyLinktext = 'Couldn\'t copy link!'
        console.log(err)
      })
    },
    onScroll: function (e: any) {
      const scroll = (e.srcElement.scrollLeft / (e.srcElement.scrollWidth / 2))
      this.isScrolling = true
      this.scrollPos = scroll
      if (scroll === 1 || scroll === 0) {
        this.isScrolling = false
      }
    },
    scrolltoQRDisplay: function (e: any) {
      e.srcElement.scrollTo({
        top: 0,
        left: (e.srcElement.scrollWidth / 2),
        behavior: 'smooth'
      })
    },
    scrolltoQRScan: function (e: any) {
      e.srcElement.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      })
    },
    startScanning: function () {
      this.enabled = true
      this.QRvideo = document.querySelector('.vm-video') as HTMLVideoElement
      this.QRcanvas = document.querySelector('.vm-canvas') as HTMLCanvasElement
      this.QRcontext = this.QRcanvas.getContext('2d')
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((stream) => {
        console.log(stream)
        const width = stream.getVideoTracks()[0].getSettings().width as number
        const height = stream.getVideoTracks()[0].getSettings().height as number
        console.log(width, height)
        this.QRvideo!.srcObject = stream
        this.QRvideo!.setAttribute('playsinline', 'true')
        this.QRvideo!.play()
        const proc = (func: any) => {
          this.QRcanvas!.width = width
          this.QRcanvas!.height = height
          this.QRcontext!.drawImage(this.QRvideo!, 0, 0, width, height)
          const imageData = this.QRcontext!.getImageData(0, 0, width, height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          })
          if (code) {
            if (this.isScanning === true) {
              this.isScanning = false
              let hasSucceded = false
              const success = (data: Record<string, unknown>) => {
                if (hasSucceded === false) {
                  hasSucceded = true
                  this.isLoading = true
                  this.isScanning = false
                  console.log(code)
                  this.pauseStream(stream)
                  this.$store.dispatch('connectToClientSide', data)
                }
              }
              const faliure = (err: number) => {
                if (hasSucceded === false) {
                  console.log(err + ' - ' + errors[err])
                  this.isLoading = false
                  this.isScanning = true
                }
              }
              QRdecodeData(code.data, success, faliure)
            }
          }
          if (this.isScrolling === false && this.enabled === true) {
            window.requestAnimationFrame(() => func(func))
          }
        }
        window.requestAnimationFrame(() => proc(proc))
      })
    },
    pauseStream: function (stream: MediaStream) {
      this.enabled = false
      const tracks = stream.getTracks()
      tracks.forEach((track) => {
        track.stop()
      })
    }
  },
  mounted: function () {
    QRdecodeData(window.location.toString(), (data: Record<string, unknown>) => {
      window.location.hash = ''
      this.$store.dispatch('connectToClientSide', data)
    }, () => {
      if (this.mobile === true) {
        this.startScanning()
      }
      this.isLoading = false
    })
  }
})
</script>

<style scoped>

main {
  scroll-snap-type: x mandatory;
  display: flex;
  overflow-x: scroll;
  overflow-y: hidden;
  max-height: 100vh;
  -webkit-overflow-scrolling: touch
}
section {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  min-width: 100vw;
}

main::-webkit-scrollbar {
  width: 0px;
}

.scrollElement {
    position: fixed;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    width:30px;
}

.scrollElement span:not(:nth-child(3)) {
    border-radius: 5px;
    width: 10px;
    height: 10px;
    background-color: #8a8a8a;
    display: block;
    position:absolute;
    transition: 0.15s ease;
}
.scrollElement[isScrolling="true"] span:not(:nth-child(3)), .scrollElement:hover span:not(:nth-child(3)) {
    width: 30px;
    background-color: #ffffff;
}
.scrollElement[isScrolling="true"] span:nth-child(3), .scrollElement:hover span:nth-child(3) {
    background-color: #8a8a8a;
}

.scrollElement span:nth-child(3) {
    position: absolute;
    border-radius: 5px;
    width: 10px;
    height: 10px;
    background-color: #ffffff;
    display: block;
    left: calc(20px * v-bind(scrollPos));
    transition: 0.15s ease;
}

.scrollElement span:nth-child(1) {
    left:0px;
}
.scrollElement span:nth-child(2) {
    right:0px;
}

.flex-center {
  display: flex;
  flex-flow:column;
  justify-content: center;
  align-items: center;
}

.pairingScreen-qrcode-display figure,
.pairingScreen-qrcode-display figure img,
.pairingScreen-qrcode-scan figure,
.pairingScreen-qrcode-scan figure video,
.pairingScreen-qrcode-scan figure canvas {
    width: 300px;
    height: 300px;
    max-width: 90vw;
    max-height: 90vh;
    border-radius: 5px;
    object-fit: cover;
}

button.buttonrow.buttons {
  width: 100%;
  max-width: 90vw;
  max-width: 90vw;
  padding: 15px 0px;
  font-family: "Inter var", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",    "Ubuntu", "Roboto", "Noto Sans", "Droid Sans", sans-serif;
  font-weight: 600;
  background-color: var(--accents-1);
  border: 1px solid var(--accents-2);
  border-radius: 5px;
  cursor: pointer;
  color:  #ffffff;
}
button.buttonrow.buttons:hover {
  background-color: var(--accents-2)
}

.buttonrow {
  width: 300px;
  max-width: 90vw;
}

p.pairinglink {
  max-width: 100%;
  overflow-y: hidden;
  padding-bottom: 10px;
}

p.pairinglink::-webkit-scrollbar {
    width: 0;
    background: #000000;
    height:5px;
}
p.pairinglink::-webkit-scrollbar-thumb {
    background: #333333;
    border-radius: 5px;
}
.modalrspacer {
  width: 40px
}

.modalButtons {
  display: flex;
  flex-flow: row;
}

</style>
