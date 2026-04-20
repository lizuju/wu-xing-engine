import { TodayMoodResult } from '../domain/mood'
import { MoodApiClient } from './api'

export abstract class MoodSession<TPayload> {
  protected result: TodayMoodResult | null = null
  protected client: MoodApiClient

  constructor(client: MoodApiClient) {
    this.client = client
  }

  abstract start(): Promise<void>

  abstract analyze(payload: TPayload): Promise<TodayMoodResult>

  getResult() {
    return this.result
  }

  protected save(result: TodayMoodResult) {
    this.result = result
    return result
  }
}

export class VoiceMoodSession extends MoodSession<Blob> {
  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('当前浏览器不支持语音采集。')
    }
  }

  async analyze(payload: Blob) {
    return this.save(await this.client.analyzeVoice(payload))
  }
}

export class FaceMoodSession extends MoodSession<Blob[]> {
  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('当前浏览器不支持摄像头访问。')
    }
  }

  async analyze(payload: Blob[]) {
    return this.save(await this.client.analyzeFace(payload))
  }
}

export class QuizMoodSession extends MoodSession<string> {
  async start() {
    return Promise.resolve()
  }

  async analyze(payload: string) {
    return this.save(await this.client.analyzeQuiz(payload))
  }
}
