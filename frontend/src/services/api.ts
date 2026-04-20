import type { MoodResultDTO, QuizOptionDTO } from '../domain/mood'
import { QuizOption, TodayMoodResult } from '../domain/mood'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const fallbackQuizOptions: QuizOptionDTO[] = [
  {
    id: 'wood-nu',
    name: '木·怒',
    caption: '最近更容易憋不住火，想把卡住的事情立刻推开。',
    wuxing: '木',
    accent: '#39c86b',
    assetKey: asset('/quiz/angry_wood.png'),
  },
  {
    id: 'fire-xi',
    name: '火·喜',
    caption: '最近情绪偏亮，想分享、想靠近、想表达。',
    wuxing: '火',
    accent: '#f05a58',
    assetKey: asset('/quiz/joy_fire.png'),
  },
  {
    id: 'earth-si',
    name: '土·思',
    caption: '最近容易反复想事，心里有些放不下。',
    wuxing: '土',
    accent: '#efc34f',
    assetKey: asset('/quiz/si_tu.png'),
  },
  {
    id: 'metal-you',
    name: '金·忧',
    caption: '最近心里有一点闷，容易对细节反复担心。',
    wuxing: '金',
    accent: '#f1f4fb',
    assetKey: asset('/quiz/worry_gold.png'),
  },
  {
    id: 'metal-bei',
    name: '金·悲',
    caption: '最近更容易低落，许多话到了嘴边也慢下来。',
    wuxing: '金',
    accent: '#9fb4df',
    assetKey: asset('/quiz/sadness_gold.png'),
  },
  {
    id: 'water-kong',
    name: '水·恐',
    caption: '最近神经绷得更紧，对未知有些过度警觉。',
    wuxing: '水',
    accent: '#5ca6ff',
    assetKey: asset('/quiz/fear_water.png'),
  },
  {
    id: 'water-jing',
    name: '水·惊',
    caption: '最近更容易被突发变化打乱，心里会忽然一紧。',
    wuxing: '水',
    accent: '#8a6cff',
    assetKey: asset('/quiz/shock_water.png'),
  },
]

const fallbackMoodResult: MoodResultDTO = {
  id: 'static-demo-result',
  mode: 'quiz',
  moodKey: '思',
  title: '今日心象',
  subtitle: '静态演示模式',
  description: 'GitHub Pages 只托管前端，这里使用本地静态结果继续完成演示流程。',
  wuxing: '土',
  radar: { 金: 42, 木: 38, 水: 54, 火: 36, 土: 82 },
  mascotId: asset('/quiz/si_tu.png'),
  tips: ['静态部署模式', '结果卡随机展示', '可继续体验交互流程'],
}

export class MoodApiClient {
  private baseUrl: string

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
  }

  async fetchQuizOptions() {
    try {
      const payload = await this.request<QuizOptionDTO[]>('/api/resources/quiz-options')
      return payload.map((item) => QuizOption.fromApi({ ...item, assetKey: asset(item.assetKey) }))
    } catch {
      return fallbackQuizOptions.map((item) => QuizOption.fromApi(item))
    }
  }

  async analyzeVoice(audio: Blob) {
    try {
      const formData = new FormData()
      formData.append('audio', audio, 'voice-input.webm')
      const payload = await this.request<MoodResultDTO>('/api/mood/voice', {
        method: 'POST',
        body: formData,
      })
      return TodayMoodResult.fromApi(payload)
    } catch {
      return TodayMoodResult.fromApi({ ...fallbackMoodResult, mode: 'voice' })
    }
  }

  async analyzeFace(image: Blob) {
    try {
      const formData = new FormData()
      formData.append('image', image, 'face-capture.png')
      const payload = await this.request<MoodResultDTO>('/api/mood/face', {
        method: 'POST',
        body: formData,
      })
      return TodayMoodResult.fromApi(payload)
    } catch {
      return TodayMoodResult.fromApi({ ...fallbackMoodResult, mode: 'face' })
    }
  }

  async analyzeQuiz(optionId: string) {
    try {
      const payload = await this.request<MoodResultDTO>('/api/mood/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionId }),
      })
      return TodayMoodResult.fromApi(payload)
    } catch {
      return TodayMoodResult.fromApi(fallbackMoodResult)
    }
  }

  private async request<T>(path: string, init?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${path}`, init)

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    return (await response.json()) as T
  }
}
