var MUTE_KEY = 'backend_messages_sound_muted'
var LAST_PLAYED_KEY = 'backend_messages_sound_last_played'
var audioContext = null

export function isMessageSoundMuted() {
  return window.localStorage.getItem(MUTE_KEY) === '1'
}

export function setMessageSoundMuted(value) {
  if (value) {
    window.localStorage.setItem(MUTE_KEY, '1')
  } else {
    window.localStorage.setItem(MUTE_KEY, '0')
  }
}

export function unlockMessageSound() {
  var Context = window.AudioContext || window.webkitAudioContext
  if (!Context) {
    return null
  }
  if (!audioContext) {
    audioContext = new Context()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  window.backend_message_sound_context = audioContext
  return audioContext
}

export function installMessageSoundUnlock() {
  if (window.backend_message_sound_unlock_bound) {
    return
  }
  window.backend_message_sound_unlock_bound = true
  var handler = function() {
    unlockMessageSound()
  }
  window.addEventListener('click', handler, true)
  window.addEventListener('keydown', handler, true)
}

export function playMessageSound() {
  if (isMessageSoundMuted()) {
    return false
  }
  var current = Date.now()
  var last = Number(window.localStorage.getItem(LAST_PLAYED_KEY) || 0)
  if (current - last < 2000) {
    return false
  }
  var context = unlockMessageSound()
  if (!context || context.state !== 'running') {
    return false
  }
  window.localStorage.setItem(LAST_PLAYED_KEY, String(current))
  var oscillator = context.createOscillator()
  var gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(620, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.09)
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(context.currentTime)
  oscillator.stop(context.currentTime + 0.26)
  return true
}
