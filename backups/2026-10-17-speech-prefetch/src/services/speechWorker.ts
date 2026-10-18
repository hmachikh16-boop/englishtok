import type { KokoroTTS } from 'kokoro-js';

const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
type KokoroVoice = 'af_heart' | 'am_michael' | 'bf_emma' | 'bm_george';

interface GenerateRequest {
  requestId: number;
  text: string;
  voice: KokoroVoice;
  speed: number;
}

type GenerateResponse =
  | { requestId: number; type: 'progress'; progress: number }
  | { requestId: number; type: 'audio'; buffer: ArrayBuffer; mimeType: string }
  | { requestId: number; type: 'error'; message: string };

interface SpeechWorkerScope {
  onmessage: ((event: MessageEvent<GenerateRequest>) => void) | null;
  postMessage(message: GenerateResponse, transfer?: Transferable[]): void;
}

const workerScope = self as unknown as SpeechWorkerScope;
let modelPromise: Promise<KokoroTTS> | null = null;

const loadModel = (requestId: number): Promise<KokoroTTS> => {
  if (!modelPromise) {
    modelPromise = import('kokoro-js')
      .then(({ KokoroTTS: Kokoro }) =>
        Kokoro.from_pretrained(KOKORO_MODEL_ID, {
          dtype: 'q8',
          device: 'wasm',
          progress_callback: (info) => {
            if (
              info.status === 'progress' &&
              info.file.endsWith('model_quantized.onnx') &&
              info.total > 0
            ) {
              workerScope.postMessage({
                requestId,
                type: 'progress',
                progress: Math.min(100, Math.round((info.loaded / info.total) * 100)),
              });
            }
          },
        })
      )
      .catch((error: unknown) => {
        modelPromise = null;
        throw error;
      });
  }

  return modelPromise;
};

workerScope.onmessage = async ({ data }) => {
  try {
    const model = await loadModel(data.requestId);
    const audio = await model.generate(data.text, {
      voice: data.voice,
      speed: data.speed,
    });
    const blob = audio.toBlob();
    const buffer = await blob.arrayBuffer();

    workerScope.postMessage(
      {
        requestId: data.requestId,
        type: 'audio',
        buffer,
        mimeType: blob.type || 'audio/wav',
      },
      [buffer]
    );
  } catch (error) {
    workerScope.postMessage({
      requestId: data.requestId,
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
