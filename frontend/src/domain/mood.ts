export type InputMode = 'voice' | 'face' | 'quiz'
export type MoodKey = '怒' | '喜' | '思' | '忧' | '悲' | '恐' | '惊'
export type Wuxing = '金' | '木' | '水' | '火' | '土'
export type RadarValues = Record<Wuxing, number>

export interface MoodResultDTO {
  id: string
  mode: InputMode
  moodKey?: MoodKey
  title: string
  subtitle: string
  description: string
  wuxing: Wuxing
  radar: RadarValues
  mascotId: string
  tips: string[]
}

export interface QuizOptionDTO {
  id: string
  name: string
  caption: string
  wuxing: Wuxing
  accent: string
  assetKey: string
}

export class TodayMoodResult {
  id: string
  mode: InputMode
  moodKey: MoodKey
  title: string
  subtitle: string
  description: string
  wuxing: Wuxing
  radar: RadarValues
  mascotId: string
  tips: string[]

  constructor(
    id: string,
    mode: InputMode,
    moodKey: MoodKey,
    title: string,
    subtitle: string,
    description: string,
    wuxing: Wuxing,
    radar: RadarValues,
    mascotId: string,
    tips: string[],
  ) {
    this.id = id
    this.mode = mode
    this.moodKey = moodKey
    this.title = title
    this.subtitle = subtitle
    this.description = description
    this.wuxing = wuxing
    this.radar = radar
    this.mascotId = mascotId
    this.tips = tips
  }

  static fromApi(payload: MoodResultDTO) {
    return new TodayMoodResult(
      payload.id,
      payload.mode,
      payload.moodKey ?? '思',
      payload.title,
      payload.subtitle,
      payload.description,
      payload.wuxing,
      payload.radar,
      payload.mascotId,
      payload.tips,
    )
  }

  orderedRadar() {
    return (['金', '木', '水', '火', '土'] as Wuxing[]).map((key) => ({
      key,
      value: this.radar[key],
    }))
  }
}

export class QuizOption {
  id: string
  name: string
  caption: string
  wuxing: Wuxing
  accent: string
  assetKey: string

  constructor(
    id: string,
    name: string,
    caption: string,
    wuxing: Wuxing,
    accent: string,
    assetKey: string,
  ) {
    this.id = id
    this.name = name
    this.caption = caption
    this.wuxing = wuxing
    this.accent = accent
    this.assetKey = assetKey
  }

  static fromApi(payload: QuizOptionDTO) {
    return new QuizOption(
      payload.id,
      payload.name,
      payload.caption,
      payload.wuxing,
      payload.accent,
      payload.assetKey,
    )
  }
}
