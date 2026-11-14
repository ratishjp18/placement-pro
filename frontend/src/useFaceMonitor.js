import { useCallback, useEffect, useRef, useState } from 'react'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'

const BASE = '/assets/mediapipe'
const TICK_MS = 600 // how often a frame is checked
const NO_FACE_MS = 5000 // face missing this long -> violation
const MULTI_FACE_MS = 3000 // 2+ faces this long -> violation

/**
 * Camera + face detection, entirely in the browser (no video is uploaded anywhere).
 *
 *   status: 'idle' | 'starting' | 'ready' | 'denied' | 'error'
 *   faces:  number of faces in the latest frame (null until the first check)
 *
 * While `armed` is true, a face that stays missing / a second face / a stopped camera
 * calls onViolation('no_face' | 'multiple_faces' | 'camera_off').
 */
export function useFaceMonitor({ armed, onViolation }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const timerRef = useRef(null)
  const since = useRef({ none: 0, multi: 0 })
  const cb = useRef(onViolation)
  cb.current = onViolation
  const armedRef = useRef(armed)
  armedRef.current = armed

  const [status, setStatus] = useState('idle')
  const [faces, setFaces] = useState(null)

  const stop = useCallback(() => {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    detectorRef.current?.close?.()
    detectorRef.current = null
  }, [])

  useEffect(() => stop, [stop])

  const tick = useCallback(() => {
    const video = videoRef.current
    const detector = detectorRef.current
    const track = streamRef.current?.getVideoTracks()[0]
    if (!video || !detector) return

    if (!track || track.readyState !== 'live') {
      setStatus('error')
      if (armedRef.current) cb.current('camera_off')
      stop()
      return
    }
    if (video.readyState < 2) return

    let n = 0
    try { n = detector.detectForVideo(video, performance.now()).detections.length } catch { return }
    setFaces(n)

    const now = performance.now()
    const s = since.current
    s.none = n === 0 ? s.none || now : 0
    s.multi = n > 1 ? s.multi || now : 0
    if (!armedRef.current) return

    if (s.none && now - s.none >= NO_FACE_MS) { s.none = now; cb.current('no_face') }
    if (s.multi && now - s.multi >= MULTI_FACE_MS) { s.multi = now; cb.current('multiple_faces') }
  }, [stop])

  const start = useCallback(async () => {
    setStatus('starting')
    try {
      stop()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await video.play()

      const fileset = await FilesetResolver.forVisionTasks(`${BASE}/wasm`)
      detectorRef.current = await FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: `${BASE}/blaze_face_short_range.tflite` },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      })
      since.current = { none: 0, multi: 0 }
      timerRef.current = setInterval(tick, TICK_MS)
      setStatus('ready')
    } catch (err) {
      stop()
      setStatus(err && (err.name === 'NotAllowedError' || err.name === 'SecurityError') ? 'denied' : 'error')
    }
  }, [stop, tick])

  return { videoRef, status, faces, start, stop }
}
