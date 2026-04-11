/**
 * 改进版 Ollama Integration Service
 * - 后端TTS：专业语音合成
 * - Whisper STT：高精度语音识别
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface EvaluationResult {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  feedback: string;
  correction: string;
}

export interface GeneratedQuestion {
  question: string;
  expectedAnswers: string[];
  explanation: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

/**
 * 主API服务类
 */
export class OllamaService {
  private static readonly timeout = 30000; // 30秒超时

  /**
   * 评估用户答案
   */
  static async evaluateAnswer(
    question: string,
    userAnswer: string,
    expectedAnswers: string[] = [],
    model: string = 'mistral'
  ): Promise<EvaluationResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userAnswer,
          expectedAnswers,
          model,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '无法评估答案');
      }

      return data.evaluation;
    } catch (error) {
      console.error('Evaluation error:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : '评估失败，请检查网络连接'
      );
    }
  }

  /**
   * 生成医疗对话问题
   */
  static async generateQuestion(
    topic: string = 'hospital',
    difficulty: string = 'medium'
  ): Promise<GeneratedQuestion> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${API_BASE_URL}/api/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          difficulty,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '无法生成问题');
      }

      return data.question;
    } catch (error) {
      console.error('Generation error:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : '生成问题失败，请检查网络连接'
      );
    }
  }

  /**
   * 检查API连接
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 获取API信息
   */
  static async getApiInfo(): Promise<{
    connected: boolean;
    apiUrl: string;
    timeout: number;
  }> {
    return {
      connected: await this.healthCheck(),
      apiUrl: API_BASE_URL,
      timeout: this.timeout,
    };
  }
}

/**
 * 后端文字转语音服务
 * 使用后端专业TTS引擎（pyttsx3/gTTS/Edge TTS等）
 */
export class TextToSpeechService {
  private audioContext: AudioContext | null = null;
  private isSupported: boolean = true;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported');
        this.isSupported = false;
      }
    }
  }

  /**
   * 检查TTS是否可用
   */
  isAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * 通过后端API播放文字转语音
   */
  async speak(
    text: string,
    options: {
      lang?: string;
      speed?: number; // 0.5-2.0
      volume?: number; // 0-1
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isSupported) {
          const error = new Error('Audio playback not supported');
          reject(error);
          options.onError?.(error);
          return;
        }

        // 停止当前播放
        this.stop();

        options.onStart?.();

        // 调用后端TTS API
        fetch(`${API_BASE_URL}/api/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            lang: options.lang || 'en-US',
            speed: Math.max(0.5, Math.min(2.0, options.speed || 1.0)),
            format: 'mp3', // 或 'wav'
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`TTS API error: ${response.status}`);
            }
            return response.blob();
          })
          .then((audioBlob) => {
            const audioUrl = URL.createObjectURL(audioBlob);
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.volume = Math.max(0, Math.min(1, options.volume || 1.0));

            this.currentAudio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              options.onEnd?.();
              resolve();
            };

            this.currentAudio.onerror = (event) => {
              const error = new Error(`Audio playback error: ${event}`);
              options.onError?.(error);
              reject(error);
            };

            this.currentAudio.play().catch((err) => {
              reject(new Error(`Failed to play audio: ${err.message}`));
            });
          })
          .catch((error) => {
            const err = new Error(`TTS failed: ${error.message}`);
            options.onError?.(err);
            reject(err);
          });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        reject(err);
      }
    });
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * 检查是否正在播放
   */
  isPlaying(): boolean {
    return !!this.currentAudio && !this.currentAudio.paused;
  }

  /**
   * 暂停
   */
  pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  /**
   * 恢复
   */
  resume(): void {
    if (this.currentAudio) {
      this.currentAudio.play();
    }
  }
}

/**
 * 高精度语音识别服务
 * 支持：
 * 1. Whisper API（OpenAI）- 最准确
 * 2. Web Speech API（备选，某些环境）
 * 3. Google Cloud Speech-to-Text（需要API密钥）
 */
export class SpeechToTextService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private stream: MediaStream | null = null;
  private useWhisper: boolean = true;

  constructor(useWhisper: boolean = true) {
    this.useWhisper = useWhisper;
  }

  /**
   * 检查是否支持
   */
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * 开始录音
   */
  async startRecording(): Promise<void> {
    try {
      this.audioChunks = [];

      // 获取麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      throw new Error(
        `无法访问麦克风: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 停止录音并返回音频
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recording not started'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.isRecording = false;

        // 关闭所有音轨
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }

        resolve(audioBlob);
      };

      try {
        this.mediaRecorder.stop();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 检查是否正在录音
   */
  isRecordingNow(): boolean {
    return this.isRecording;
  }

  /**
   * 使用Whisper API识别语音
   * 更高的准确率，支持多种语言
   */
  async recognizeWithWhisper(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('language', 'en'); // 或 'zh' 等

      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '转录失败');
      }

      return data.text;
    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : '语音识别失败，请重试'
      );
    }
  }

  /**
   * 完整流程：录音 → 识别 → 返回文本
   */
  async recordAndTranscribe(
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: Error) => void
  ): Promise<string> {
    try {
      onStart?.();

      // 开始录音
      await this.startRecording();

      // 等待音频录制（由外部控制停止，如按钮释放）
      // 这个方法会在 stopRecording 被调用时完成

      // 注意：这里返回一个promise，但实际的停止由外部控制
      return new Promise((resolve, reject) => {
        // 保存resolve以便外部调用时使用
        (this as any)._resolveTranscription = async () => {
          try {
            const audioBlob = await this.stopRecording();
            onEnd?.();

            // 使用Whisper识别
            const text = await this.recognizeWithWhisper(audioBlob);
            resolve(text);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            reject(err);
          }
        };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      throw err;
    }
  }

  /**
   * 解决转录（由按钮释放事件调用）
   */
  async finishRecording(): Promise<string> {
    if ((this as any)._resolveTranscription) {
      return (this as any)._resolveTranscription();
    }
    throw new Error('No active recording');
  }
}
