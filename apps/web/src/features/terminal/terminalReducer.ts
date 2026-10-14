import { GuessRecord } from '@neon-cipher/game-rules';
import { SessionConfig } from './terminalService';

export type TerminalStatus = 'playing' | 'won' | 'lost';

export interface TerminalState {
  sessionId: string | null;
  config: SessionConfig | null;
  startedAt: number;
  attemptsLeft: number | null;
  status: TerminalStatus;
  history: GuessRecord[];
  entry: number[];
  validationError: string | null;
  shakeKey: number;
  secret?: string;
  payout?: number;
  fine?: number;
  loading: boolean;
  error: string | null;
  elapsedSeconds: number;
}

export const initialTerminalState: TerminalState = {
  sessionId: null,
  config: null,
  startedAt: 0,
  attemptsLeft: 0,
  status: 'playing',
  history: [],
  entry: [],
  validationError: null,
  shakeKey: 0,
  secret: undefined,
  payout: undefined,
  fine: undefined,
  loading: true,
  error: null,
  elapsedSeconds: 0,
};

export type TerminalAction =
  | {
      type: 'INIT_SESSION';
      payload: { sessionId: string; config: SessionConfig; startedAt: number };
    }
  | { type: 'INPUT_DIGIT'; digit: number }
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR_ENTRY' }
  | { type: 'SET_VALIDATION_ERROR'; error: string; shake?: boolean }
  | { type: 'CLEAR_VALIDATION_ERROR' }
  | { type: 'SUBMIT_START' }
  | {
      type: 'SUBMIT_SUCCESS';
      payload: {
        pots: number;
        pans: number;
        attemptsLeft: number;
        status: 'playing' | 'won' | 'lost' | 'active';
        secret?: string;
        payout?: number;
        fine?: number;
      };
    }
  | { type: 'SUBMIT_FAIL'; error: string }
  | { type: 'SET_TIMEOUT_LOSS'; secret?: string }
  | { type: 'TICK_TIMER'; now: number };

export function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case 'INIT_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        config: action.payload.config,
        startedAt: action.payload.startedAt,
        attemptsLeft: action.payload.config.attempts,
        status: 'playing',
        history: [],
        entry: [],
        validationError: null,
        shakeKey: 0,
        secret: undefined,
        payout: undefined,
        fine: undefined,
        loading: false,
        error: null,
        elapsedSeconds: 0,
      };

    case 'INPUT_DIGIT': {
      if (state.status !== 'playing' || !state.config) return state;

      // Check if already filled
      if (state.entry.length >= state.config.digits) {
        return {
          ...state,
          validationError: `Max ${state.config.digits} digits`,
          shakeKey: state.shakeKey + 1,
        };
      }

      // Check uniqueness on unique-only tiers
      if (!state.config.allowDuplicates && state.entry.includes(action.digit)) {
        return {
          ...state,
          validationError: 'No repeats on this tier',
          shakeKey: state.shakeKey + 1,
        };
      }

      return {
        ...state,
        entry: [...state.entry, action.digit],
        validationError: null,
      };
    }

    case 'BACKSPACE': {
      if (state.status !== 'playing' || state.entry.length === 0) return state;
      return {
        ...state,
        entry: state.entry.slice(0, -1),
        validationError: null,
      };
    }

    case 'CLEAR_ENTRY': {
      if (state.status !== 'playing') return state;
      return {
        ...state,
        entry: [],
        validationError: null,
      };
    }

    case 'SET_VALIDATION_ERROR': {
      return {
        ...state,
        validationError: action.error,
        shakeKey: action.shake ? state.shakeKey + 1 : state.shakeKey,
      };
    }

    case 'CLEAR_VALIDATION_ERROR': {
      return {
        ...state,
        validationError: null,
      };
    }

    case 'SUBMIT_START': {
      return {
        ...state,
        error: null,
      };
    }

    case 'SUBMIT_SUCCESS': {
      const normalizedStatus: TerminalStatus =
        action.payload.status === 'won'
          ? 'won'
          : action.payload.status === 'lost'
          ? 'lost'
          : 'playing';

      const newRecord: GuessRecord = {
        guess: [...state.entry],
        pots: action.payload.pots,
        pans: action.payload.pans,
      };

      return {
        ...state,
        history: [...state.history, newRecord],
        attemptsLeft: action.payload.attemptsLeft,
        status: normalizedStatus,
        secret: action.payload.secret,
        payout: action.payload.payout,
        fine: action.payload.fine,
        entry: [],
        validationError: null,
      };
    }

    case 'SUBMIT_FAIL': {
      return {
        ...state,
        error: action.error,
      };
    }

    case 'SET_TIMEOUT_LOSS': {
      if (state.status !== 'playing') return state;
      return {
        ...state,
        status: 'lost',
        secret: action.secret || state.secret,
        attemptsLeft: 0,
        validationError: 'Time expired',
      };
    }

    case 'TICK_TIMER': {
      if (state.status !== 'playing' || !state.config || state.startedAt === 0) return state;
      const elapsed = Math.max(0, Math.floor((action.now - state.startedAt) / 1000));
      const timerSecs = state.config.timerSeconds;
      const isExpired = timerSecs !== null && timerSecs > 0 && elapsed >= timerSecs;
      return {
        ...state,
        elapsedSeconds: elapsed,
        status: isExpired ? 'lost' : state.status,
        attemptsLeft: isExpired ? 0 : state.attemptsLeft,
      };
    }

    default:
      return state;
  }
}
