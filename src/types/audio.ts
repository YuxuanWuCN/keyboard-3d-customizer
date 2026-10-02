import { SwitchType, SwitchModelId } from './keyboard';

export interface SwitchSpecs {
  id: SwitchModelId;
  name: string;
  type: SwitchType;
  stemColor: string;
  housingColor: string;
  housingTranslucency: number; // 0.0 to 1.0
  actuationDistance: number;   // mm (e.g. 2.0)
  totalTravel: number;         // mm (e.g. 4.0)
  actuationForce: number;      // gf (e.g. 45-67)
  soundProfile: {
    resonantFreq: number;      // Hz
    qFactor: number;
    transientSpike: boolean;
    clackRatio: number;
  };
}

export interface SoundEngineInterface {
  init(): Promise<void>;
  unlock(): Promise<void>;
  playKeyDown(keyId: string, switchType: SwitchType, hasFoam: boolean): void;
  playKeyUp(keyId: string, switchType: SwitchType, hasFoam: boolean): void;
  dispose(): void;
}

export interface KeystrokeEvent {
  key: string;
  code: string;
  timestamp: number;
  correct: boolean;
}

export interface TypingTelemetry {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errorCount: number;
  streak: number;
  elapsedSeconds: number;
}
