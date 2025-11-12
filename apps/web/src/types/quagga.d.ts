declare module 'quagga' {
  export interface QuaggaConfig {
    inputStream?: {
      name?: string
      type?: string
      target?: HTMLElement | string
      constraints?: MediaStreamConstraints
      area?: {
        top?: string
        right?: string
        left?: string
        bottom?: string
      }
      singleChannel?: boolean
    }
    locator?: {
      patchSize?: string
      halfSample?: boolean
    }
    numOfWorkers?: number
    frequency?: number
    decoder?: {
      readers?: string[]
      multiple?: boolean
    }
    locate?: boolean
    src?: string
  }

  export interface QuaggaResult {
    codeResult?: {
      code?: string
      format?: string
      start?: number
      end?: number
      codeset?: number
      startInfo?: {
        error?: number
        code?: number
        start?: number
        end?: number
      }
      decodedCodes?: any[]
      endInfo?: {
        error?: number
        code?: number
        start?: number
        end?: number
      }
    }
    line?: any[]
    angle?: number
    pattern?: any[]
    box?: number[][]
  }

  export interface QuaggaStatic {
    init(
      config: QuaggaConfig,
      callback?: (err: any) => void
    ): void
    start(): void
    stop(): void
    onDetected(callback: (data: QuaggaResult) => void): void
    onProcessed(callback: (result: any) => void): void
    offDetected(callback: (data: QuaggaResult) => void): void
    offProcessed(callback: (result: any) => void): void
    decodeSingle(
      config: QuaggaConfig,
      callback: (result: QuaggaResult) => void
    ): void
  }

  const Quagga: QuaggaStatic
  export default Quagga
}
