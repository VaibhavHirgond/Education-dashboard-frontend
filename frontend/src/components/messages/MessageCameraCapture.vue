<template>
  <div class="camera-overlay">
    <button type="button" class="camera-backdrop" aria-label="Close camera" v-on:click="cancel"></button>
    <div class="camera-panel" role="dialog" aria-label="Camera capture">
      <div class="camera-head">
        <span>Camera capture</span>
        <button type="button" class="camera-close" aria-label="Close camera" v-on:click="cancel">×</button>
      </div>
      <div v-if="errorMessage" class="camera-error">
        <div class="camera-error-text">{{ errorMessage }}</div>
        <div class="camera-error-actions">
          <button type="button" class="camera-secondary" v-on:click="cancel">Cancel</button>
          <button type="button" class="camera-primary" v-on:click="chooseFile">Choose a photo instead</button>
        </div>
      </div>
      <template v-else>
        <div v-if="!capturedUrl" class="camera-stage">
          <video ref="videoRef" class="camera-video" v-bind:class="videoReady ? 'camera-video-ready' : ''" autoplay playsinline muted></video>
          <div v-if="!videoReady" class="camera-loading">Starting camera...</div>
        </div>
        <img v-else class="camera-photo" v-bind:src="capturedUrl" alt="Camera capture preview" />
        <div class="camera-actions">
          <template v-if="!capturedUrl">
            <button type="button" class="camera-secondary" v-on:click="cancel">Cancel</button>
            <button v-if="cameraCount > 1" type="button" class="camera-secondary" v-on:click="switchCamera">Switch camera</button>
            <button type="button" class="camera-primary" v-bind:disabled="!videoReady" v-on:click="capture">Capture</button>
          </template>
          <template v-else>
            <button type="button" class="camera-secondary" v-on:click="retake">Retake</button>
            <button type="button" class="camera-primary" v-on:click="usePhoto">Use photo</button>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessageCameraCapture',
  data() {
    return {
      stream: null,
      facingMode: 'user',
      errorMessage: '',
      videoReady: false,
      capturedUrl: '',
      capturedBlob: null,
      cameraCount: 0,
      startTimer: null,
      captureTimer: null
    }
  },
  mounted() {
    this.start()
  },
  beforeUnmount() {
    window.clearTimeout(this.captureTimer)
    this.captureTimer = null
    this.stopTracks()
  },
  methods: {
    describeError(error) {
      var name = String((error && error.name) || '')
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError' || name === 'NotSupportedError') {
        return 'Camera permission was denied or blocked. Allow camera access for this page, or choose a photo instead.'
      }
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return 'No camera was found on this device. Choose a photo instead.'
      }
      if (name === 'NotReadableError' || name === 'TrackStartError') {
        return 'The camera is busy or unavailable. Close other camera apps, or choose a photo instead.'
      }
      if (name === 'OverconstrainedError') {
        return 'The selected camera is not available. Choose a photo instead.'
      }
      return 'Camera is not available here. Choose a photo instead.'
    },
    setError(message) {
      this.stopTracks()
      window.clearTimeout(this.captureTimer)
      this.captureTimer = null
      this.errorMessage = message || 'Camera is not available here. Choose a photo instead.'
      this.videoReady = false
    },
    stopTracks() {
      window.clearTimeout(this.startTimer)
      this.startTimer = null
      if (!this.stream) {
        return
      }
      var tracks = this.stream.getTracks()
      var i = 0
      while (i < tracks.length) {
        tracks[i].stop()
        i = i + 1
      }
      this.stream = null
    },
    start() {
      var self = this
      this.stopTracks()
      this.errorMessage = ''
      this.capturedUrl = ''
      this.capturedBlob = null
      this.videoReady = false
      this.startTimer = window.setTimeout(function() {
        if (!self.videoReady && !self.capturedBlob) {
          self.setError('Camera did not start in time. Check the camera connection, or choose a photo instead.')
        }
      }, 9000)
      if (window.isSecureContext === false) {
        this.setError('Camera requires HTTPS or localhost. Open this page over a secure connection, or choose a photo instead.')
        return
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.setError('This browser does not support camera access. Choose a photo instead.')
        return
      }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: this.facingMode }, audio: false }).then(function(stream) {
        self.stream = stream
        self.$nextTick(function() {
          var video = self.$refs.videoRef
          if (!video) {
            return
          }
          video.srcObject = stream
          video.onloadedmetadata = function() {
            window.clearTimeout(self.startTimer)
            self.startTimer = null
            self.videoReady = true
          }
          var playing = video.play()
          if (playing && playing.catch) {
            playing.catch(function() {
              self.videoReady = true
            })
          }
        })
        if (navigator.mediaDevices.enumerateDevices) {
          navigator.mediaDevices.enumerateDevices().then(function(devices) {
            var count = 0
            var i = 0
            while (i < devices.length) {
              if (devices[i].kind === 'videoinput') {
                count = count + 1
              }
              i = i + 1
            }
            self.cameraCount = count
          }).catch(function() {
            self.cameraCount = 0
          })
        }
      }).catch(function(error) {
        self.setError(self.describeError(error))
      })
    },
    switchCamera() {
      if (this.cameraCount <= 1) {
        return
      }
      if (this.facingMode === 'user') {
        this.facingMode = 'environment'
      } else {
        this.facingMode = 'user'
      }
      this.start()
    },
    capture() {
      var self = this
      var video = this.$refs.videoRef
      if (!video || !video.videoWidth || !video.videoHeight) {
        this.setError('The camera preview is not ready yet. Try again, or choose a photo instead.')
        return
      }
      if (!HTMLCanvasElement.prototype.getContext) {
        this.setError('This browser cannot capture a photo. Choose a photo instead.')
        return
      }
      var canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      var context = canvas.getContext('2d')
      if (!context) {
        this.setError('This browser cannot capture a photo. Choose a photo instead.')
        return
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      if (!canvas.toBlob) {
        this.setError('This browser cannot capture a photo. Choose a photo instead.')
        return
      }
      this.captureTimer = window.setTimeout(function() {
        if (!self.capturedBlob) {
          self.setError('Camera capture timed out. Try again, or choose a photo instead.')
        }
      }, 6000)
      canvas.toBlob(function(blob) {
        window.clearTimeout(self.captureTimer)
        self.captureTimer = null
        if (!blob) {
          self.setError('Unable to capture a photo. Choose a photo instead.')
          return
        }
        self.capturedBlob = blob
        self.capturedUrl = canvas.toDataURL('image/jpeg', 0.86)
        self.stopTracks()
      }, 'image/jpeg', 0.86)
    },
    retake() {
      this.capturedBlob = null
      this.capturedUrl = ''
      this.start()
    },
    usePhoto() {
      if (!this.capturedBlob) {
        this.setError('Unable to use this photo. Choose a photo instead.')
        return
      }
      this.stopTracks()
      this.$emit('captured', this.capturedBlob)
    },
    chooseFile() {
      window.clearTimeout(this.captureTimer)
      this.captureTimer = null
      this.stopTracks()
      this.$emit('fallback')
    },
    cancel() {
      window.clearTimeout(this.captureTimer)
      this.captureTimer = null
      this.stopTracks()
      this.$emit('cancel')
    }
  }
}
</script>

<style scoped>
.camera-overlay {
  position: fixed;
  inset: 0;
  z-index: 45000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}
.camera-backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(18, 16, 30, 0.72);
}
.camera-panel {
  position: relative;
  width: min(420px, 100%);
  max-height: 92dvh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 14px;
  border: 1px solid #d7deea;
  border-radius: 18px;
  background: #ffffff;
  color: #1f2937;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.15);
  overflow-y: auto;
}
.camera-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
  font-size: 13px;
  font-weight: 800;
}
.camera-close {
  width: 44px;
  height: 44px;
  border: 1px solid #d7deea;
  border-radius: 50%;
  background: #f1f3f9;
  color: #64748b;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.camera-stage {
  position: relative;
  min-height: 180px;
  border-radius: 10px;
  background: #eef2f7;
  overflow: hidden;
}
.camera-video,
.camera-photo {
  display: block;
  width: 100%;
  max-height: 52dvh;
  border-radius: 12px;
  background: #eef2f7;
  object-fit: cover;
}
.camera-video {
  opacity: 0;
}
.camera-video-ready {
  opacity: 1;
}
.camera-loading {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 12px;
  text-align: center;
}
.camera-error {
  padding: 16px 10px;
  border: 1px solid #d7deea;
  border-radius: 10px;
  background: #f8f9ff;
}
.camera-error-text {
  color: #1f2937;
  font-size: 12px;
  line-height: 1.5;
}
.camera-error-actions,
.camera-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.camera-secondary,
.camera-primary {
  min-height: 44px;
  border-radius: 12px;
  padding: 8px 14px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}
.camera-secondary {
  border: 1px solid #d7deea;
  background: #f1f3f9;
  color: #475569;
}
.camera-primary {
  border: none;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.camera-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
@media (max-width: 520px) {
  .camera-panel {
    padding: 10px;
    border-radius: 18px;
  }
  .camera-video,
  .camera-photo {
    max-height: 48dvh;
  }
  .camera-actions,
  .camera-error-actions {
    justify-content: stretch;
  }
  .camera-secondary,
  .camera-primary {
    flex: 1 1 auto;
  }
}
</style>
