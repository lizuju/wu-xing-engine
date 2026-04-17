import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { QuizOption } from './domain/mood'
import { MoodApiClient } from './services/api'
import { FaceMoodSession, QuizMoodSession, VoiceMoodSession } from './services/sessions'
import './styles.css'

type Screen = 'home' | 'voice' | 'face' | 'face-processing' | 'quiz' | 'card'

const client = new MoodApiClient()
const voiceSession = new VoiceMoodSession(client)
const faceSession = new FaceMoodSession(client)
const quizSession = new QuizMoodSession(client)
const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
const weatherCardImages = [
  asset('/result-cards/joy.png'),
  asset('/result-cards/worry.png'),
  asset('/result-cards/sadness.png'),
  asset('/result-cards/angry.png'),
  asset('/result-cards/thought.png'),
  asset('/result-cards/fear.png'),
  asset('/result-cards/shock.png'),
]
const quizCardImages: Record<string, string> = {
  'wood-nu': asset('/result-cards/angry.png'),
  'fire-xi': asset('/result-cards/joy.png'),
  'earth-si': asset('/result-cards/thought.png'),
  'metal-you': asset('/result-cards/worry.png'),
  'metal-bei': asset('/result-cards/sadness.png'),
  'water-kong': asset('/result-cards/fear.png'),
  'water-jing': asset('/result-cards/shock.png'),
}

function PageFrame({
  className,
  title,
  subtitle,
  onBack,
  hideHeader,
  children,
}: {
  className?: string
  title: string
  subtitle?: string
  onBack?: () => void
  hideHeader?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={`screen ${className ?? ''}`.trim()}>
      {!hideHeader ? (
        <header className="screen-header">
          {onBack ? (
            <button className="icon-button" type="button" onClick={onBack} aria-label="返回">
              ←
            </button>
          ) : (
            <div className="icon-button icon-button-placeholder" />
          )}
          <div>
            <p className="screen-kicker">今日心象</p>
            <h1>{title}</h1>
            {subtitle ? <p className="screen-subtitle">{subtitle}</p> : null}
          </div>
        </header>
      ) : null}
      {children}
    </section>
  )
}

function HomeScreen({
  onVoice,
  onFace,
  onQuiz,
}: {
  onVoice: () => void
  onFace: () => void
  onQuiz: () => void
}) {
  return (
    <PageFrame className="home-screen" title="剧镜" hideHeader>
      <div className="home-top">
        <div className="home-title-block">
          <p className="home-greeting">
            Hi，先照
            <br />
            照今天的心情吧～
          </p>
        </div>
        <a className="home-avatar-shell" href="https://github.com/lizuju/" target="_blank" rel="noreferrer" aria-label="打开 GitHub 主页">
          <img src={asset('/home/avatar-user.jpg')} alt="" className="home-avatar" />
          <span className="home-avatar-status" />
        </a>
      </div>

      <div className="home-social-pill">
        <img src={asset('/home/xingxing-icon.png')} alt="" />
        <span>此刻有 1,248 位旅人与您一起安放情绪</span>
      </div>

      <div className="home-hero">
        <div className="hero-orb">
          <img src={asset('/home/ip-mascot.png')} alt="首页 IP 形象" className="hero-mascot-image" />
        </div>
      </div>

      <div className="mode-grid">
        <button className="mode-button mode-button-side" type="button" onClick={onFace}>
          面容识情
        </button>
        <button className="mode-button mode-button-primary mode-button-center" type="button" onClick={onQuiz}>
          七情微测
        </button>
        <button className="mode-button mode-button-side" type="button" onClick={onVoice}>
          说说此刻
        </button>
      </div>

      <div className="home-copy">
        <p>
          从面容、声音或七情微测开始，看看此刻更
          <br />
          靠近哪一种情志～
        </p>
      </div>

      <div className="home-footer-nav">
        <img src={asset('/home/bottom-nav-bg.png')} alt="" className="home-footer-nav-bg" />
        <button className="footer-nav-item active" type="button">
          <img src={asset('/home/xinjing-icon.png')} alt="" className="footer-nav-icon footer-nav-icon-main" />
          <span>心境</span>
        </button>
        <button className="footer-nav-item" type="button">
          <img src={asset('/home/jujing-icon.png')} alt="" className="footer-nav-icon" />
          <span>剧境</span>
        </button>
        <button className="footer-nav-item" type="button">
          <img src={asset('/home/xinjing-main.png')} alt="" className="footer-nav-icon footer-nav-icon-star" />
          <span>共鸣</span>
        </button>
        <button className="footer-nav-item" type="button">
          <img src={asset('/home/jingyu-icon.png')} alt="" className="footer-nav-icon" />
          <span>静域</span>
        </button>
      </div>
    </PageFrame>
  )
}

function VoiceScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void
  onSubmit: (audio: Blob) => Promise<void>
}) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const autoStopRef = useRef<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
      if (autoStopRef.current) {
        window.clearTimeout(autoStopRef.current)
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const startRecording = async () => {
    try {
      await voiceSession.start()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      setElapsed(0)
      setError(null)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        void onSubmit(blob)
      }

      recorder.start()
      setIsRecording(true)
      timerRef.current = window.setInterval(() => {
        setElapsed((current) => current + 1)
      }, 1000)
      autoStopRef.current = window.setTimeout(() => {
        stopRecording()
      }, 3600)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '无法开始录音。')
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setIsRecording(false)
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (autoStopRef.current) {
      window.clearTimeout(autoStopRef.current)
      autoStopRef.current = null
    }
  }

  return (
    <PageFrame className="voice-screen" title="语音输入" hideHeader>
      <div className="voice-top">
        <button className="icon-button voice-top-button" type="button" onClick={onBack} aria-label="返回">
          ←
        </button>
      </div>

      <div className="voice-orbit" onClick={isRecording ? stopRecording : startRecording} aria-hidden="true">
        <div className="voice-orbit-line voice-orbit-line-a" />
        <div className="voice-orbit-line voice-orbit-line-b" />
        <div className="voice-orbit-line voice-orbit-line-c" />
        <div className={`voice-core ${isRecording ? 'recording' : ''}`}>
          <div className="voice-wave-bars" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <h2>{isRecording ? '慢慢说，我一直在听' : '慢慢说，我在这里'}</h2>
          <p>{isRecording ? '想到哪里说到哪里，不需要完整句子' : '点按圆环开始录音，再点一次结束'}</p>
        </div>
      </div>

      <div className="voice-topic-block">
        <p className="voice-topic-title">或者试试这些话题</p>
        <div className="voice-topic-list">
          <button className="voice-topic-chip" type="button">
            <img src={asset('/voice/chat-icon.png')} alt="" />
            <span>今天最累的事</span>
          </button>
          <button className="voice-topic-chip" type="button">
            <img src={asset('/voice/smile-icon.png')} alt="" />
            <span>我最想说的话</span>
          </button>
          <button className="voice-topic-chip" type="button">
            <img src={asset('/voice/star-icon.png')} alt="" />
            <span>此刻最亮的念头</span>
          </button>
        </div>
      </div>

      <div className="voice-timer">
        <span className="voice-timer-dot" />
        <span>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</span>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </PageFrame>
  )
}

function FaceCaptureScreen({
  onBack,
  onCapture,
}: {
  onBack: () => void
  onCapture: (blob: Blob, previewUrl: string, stream: MediaStream | null) => Promise<void>
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const handedOffRef = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const boot = async () => {
      try {
        await faceSession.start()
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
          },
          audio: false,
        })
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : '无法访问摄像头。')
      }
    }

    boot()

    return () => {
      mounted = false
      if (!handedOffRef.current) {
        streamRef.current?.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const capture = async () => {
    const video = videoRef.current
    if (!video) {
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) {
      return
    }
    handedOffRef.current = true
    await onCapture(blob, URL.createObjectURL(blob), streamRef.current)
  }

  return (
    <PageFrame className="face-screen" title="面容识情" hideHeader>
      <div className="face-top">
        <button className="icon-button face-top-button" type="button" onClick={onBack} aria-label="返回">
          ←
        </button>
      </div>

      <div className="face-copy">
        <h1>面容识情</h1>
        <p>把脸放进取景框，让我看看你此刻的神色</p>
      </div>

      <div className="face-frame">
        <video ref={videoRef} className="camera-preview" autoPlay muted playsInline />
        <div className="face-guide face-guide-top-left" />
        <div className="face-guide face-guide-top-right" />
        <div className="face-guide face-guide-bottom-left" />
        <div className="face-guide face-guide-bottom-right" />
      </div>

      <div className="face-actions">
        <button className="face-primary-button" type="button" onClick={capture}>
          开始感知
        </button>
        <p className="face-note">注：仅用于本次识别，不保存照片</p>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </PageFrame>
  )
}

function FaceProcessingScreen({
  stream,
  previewUrl,
  durationMs,
  onBack,
}: {
  stream: MediaStream | null
  previewUrl: string | null
  durationMs: number
  onBack: () => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current
      video.srcObject = stream
      void video.play().catch(() => {
        // Some mobile browsers delay autoplay until an explicit play() call.
      })
    }
  }, [stream])

  useEffect(() => {
    const startedAt = window.performance.now()
    const timer = window.setInterval(() => {
      const elapsed = window.performance.now() - startedAt
      const next = Math.min(100, Math.round((elapsed / durationMs) * 100))
      setProgress(next)
    }, 60)

    return () => {
      window.clearInterval(timer)
    }
  }, [durationMs])

  return (
    <PageFrame className="face-processing-screen" title="正在识别你的主情志" hideHeader>
      <div className="face-top">
        <button className="icon-button face-top-button" type="button" onClick={onBack} aria-label="返回">
          ←
        </button>
      </div>

      <div className="face-copy face-processing-copy">
        <h1>正在识别你的主情志</h1>
        <p>识别后将为你生成相胜建议</p>
      </div>

      <div className="face-processing-stage">
        <div className="face-processing-stage-bg" />
        {previewUrl ? (
          <img src={previewUrl} alt="人脸预览" className="capture-preview face-processing-cutout face-processing-preview-fallback" />
        ) : null}
        {stream ? (
          <video
            ref={videoRef}
            className="face-processing-video"
            autoPlay
            muted
            playsInline
            onLoadedMetadata={() => {
              if (videoRef.current) {
                void videoRef.current.play().catch(() => {})
              }
            }}
          />
        ) : null}
      </div>

      <div className="processing-meter face-processing-meter">
        <strong>{progress}%</strong>
        <span>感知中...</span>
      </div>
    </PageFrame>
  )
}

function QuizScreen({
  options,
  onSubmit,
  busy,
}: {
  options: QuizOption[]
  onSubmit: (optionId: string) => Promise<void>
  busy: boolean
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const dragStartX = useRef<number | null>(null)

  useEffect(() => {
    const preferredIndex = options.findIndex((option) => option.id === 'earth-si')
    setSelectedIndex(preferredIndex >= 0 ? preferredIndex : 0)
  }, [options])

  const selected = options[selectedIndex]
  const previous = options[(selectedIndex - 1 + options.length) % options.length]
  const next = options[(selectedIndex + 1) % options.length]
  const selectedName = selected?.name.replace('·', '') ?? ''
  const confirmLabel = selected ? `确认${selectedName}并查看推荐` : '确认并查看推荐'

  const shift = (direction: 'prev' | 'next') => {
    if (!options.length) {
      return
    }

    setSelectedIndex((current) =>
      direction === 'prev'
        ? (current - 1 + options.length) % options.length
        : (current + 1) % options.length,
    )
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const startX = dragStartX.current
    if (startX === null) {
      return
    }

    const deltaX = event.clientX - startX
    if (Math.abs(deltaX) > 36) {
      shift(deltaX > 0 ? 'prev' : 'next')
    }
    dragStartX.current = null
  }

  return (
    <PageFrame className="quiz-screen" title="七情微测" hideHeader>
      <div className="quiz-copy">
        <h1>
          滑动看看，哪一种情志
          <br />
          更接近现在的你
        </h1>
      </div>

      {selected ? (
        <>
          <div
            className="quiz-stage"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          >
            <button
              className="quiz-side-card quiz-side-card-left"
              type="button"
              onClick={() => shift('prev')}
            >
              <img src={previous.assetKey} alt="" />
              <span>{previous.name}</span>
            </button>

            <div className="quiz-center-card" style={{ ['--accent' as string]: selected.accent }}>
              <img src={selected.assetKey} alt={selected.name} className="quiz-center-image" />
            </div>

            <button
              className="quiz-side-card quiz-side-card-right"
              type="button"
              onClick={() => shift('next')}
            >
              <img src={next.assetKey} alt="" />
              <span>{next.name}</span>
            </button>
          </div>

          <div className="quiz-selection-copy" style={{ ['--quiz-accent' as string]: selected.accent }}>
            <h2>{selected.name}</h2>
            <p>{selected.caption}</p>
          </div>

          <div className="quiz-dots" aria-hidden="true" style={{ ['--quiz-accent' as string]: selected.accent }}>
            {options.map((option, index) => (
              <span
                key={option.id}
                className={`quiz-dot ${index === selectedIndex ? 'active' : ''}`}
              />
            ))}
          </div>

          <button
            className="quiz-confirm-button"
            style={{
              ['--quiz-accent' as string]: selected.accent,
              ['--quiz-button-text' as string]: ['earth-si', 'metal-you', 'metal-bei'].includes(selected.id) ? '#101421' : '#fafafa',
            }}
            type="button"
            disabled={busy}
            onClick={() => onSubmit(selected.id)}
          >
            {busy ? '生成中...' : confirmLabel}
          </button>
          <p className="quiz-note">确认后将为你匹配与 {selected.name} 更接近的推荐</p>
        </>
      ) : null}
    </PageFrame>
  )
}

function WeatherCardScreen({ imageSrc, onRestart }: { imageSrc: string; onRestart: () => void }) {
  return (
    <section className="screen card-screen card-screen-visual">
      <button className="icon-button card-back-button" type="button" onClick={onRestart} aria-label="返回首页">
        ←
      </button>
      <img src={imageSrc} alt="结果气象卡" className="weather-card-image" />
    </section>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardImage, setCardImage] = useState<string | null>(null)
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([])
  const [facePreviewUrl, setFacePreviewUrl] = useState<string | null>(null)
  const [faceStream, setFaceStream] = useState<MediaStream | null>(null)
  const faceStreamRef = useRef<MediaStream | null>(null)
  const faceProcessingDuration = 3600

  useEffect(() => {
    client
      .fetchQuizOptions()
      .then(setQuizOptions)
      .catch(() => {
        setError('七情微测资源清单暂时没有加载成功。')
      })
  }, [])

  const pickRandomCard = () => {
    const index = Math.floor(Math.random() * weatherCardImages.length)
    return weatherCardImages[index]
  }

  const handleVoice = async (audio: Blob) => {
    try {
      setBusy(true)
      setError(null)
      await voiceSession.analyze(audio)
      setCardImage(pickRandomCard())
      setScreen('card')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '语音分析失败。')
    } finally {
      setBusy(false)
    }
  }

  const stopFaceStream = () => {
    faceStreamRef.current?.getTracks().forEach((track) => track.stop())
    faceStreamRef.current = null
    setFaceStream(null)
  }

  const handleFace = async (image: Blob, previewUrl: string, stream: MediaStream | null) => {
    try {
      setBusy(true)
      setError(null)
      setFacePreviewUrl(previewUrl)
      faceStreamRef.current = stream
      setFaceStream(stream)
      setScreen('face-processing')
      const [nextResult] = await Promise.all([
        faceSession.analyze(image),
        new Promise((resolve) => window.setTimeout(resolve, faceProcessingDuration)),
      ])
      void nextResult
      stopFaceStream()
      setCardImage(pickRandomCard())
      setScreen('card')
    } catch (caught) {
      stopFaceStream()
      setError(caught instanceof Error ? caught.message : '人脸分析失败。')
      setScreen('face')
    } finally {
      setBusy(false)
    }
  }

  const handleQuiz = async (optionId: string) => {
    try {
      setBusy(true)
      setError(null)
      await quizSession.analyze(optionId)
      setCardImage(quizCardImages[optionId])
      setScreen('card')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '七情微测失败。')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    stopFaceStream()
    setError(null)
    setBusy(false)
    setCardImage(null)
    setFacePreviewUrl(null)
    setScreen('home')
  }

  return (
    <main className="app-shell" style={{ '--asset-home-bg': `url("${asset('/home/home-bg.png')}")` } as CSSProperties}>
      <div className="phone-shell">
        {screen === 'home' ? <HomeScreen onVoice={() => setScreen('voice')} onFace={() => setScreen('face')} onQuiz={() => setScreen('quiz')} /> : null}
        {screen === 'voice' ? <VoiceScreen onBack={reset} onSubmit={handleVoice} /> : null}
        {screen === 'face' ? <FaceCaptureScreen onBack={reset} onCapture={handleFace} /> : null}
        {screen === 'face-processing' ? <FaceProcessingScreen stream={faceStream} previewUrl={facePreviewUrl} durationMs={faceProcessingDuration} onBack={reset} /> : null}
        {screen === 'quiz' ? <QuizScreen options={quizOptions} onSubmit={handleQuiz} busy={busy} /> : null}
        {screen === 'card' && cardImage ? <WeatherCardScreen imageSrc={cardImage} onRestart={reset} /> : null}
        {error ? <div className="global-toast">{error}</div> : null}
      </div>
    </main>
  )
}

export default App
