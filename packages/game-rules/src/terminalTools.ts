export interface TerminalToolRule {
  id: string;
  name: string;
  creditCost: number;
  effectType:
    | 'eliminate_digit'
    | 'firewall_shield'
    | 'add_time'
    | 'detect_duplicates'
    | 'probe_parity'
    | 'blackout_ping'
    | 'false_flag_echo';
  description: string;
}

export const TERMINAL_TOOL_RULES: Record<string, TerminalToolRule> = {
  'tool-static-injector': {
    id: 'tool-static-injector',
    name: 'Static Injector',
    creditCost: 300,
    effectType: 'eliminate_digit',
    description: 'Scrambles frequency noise to eliminate a false dead digit.',
  },
  'tool-frequency-probe': {
    id: 'tool-frequency-probe',
    name: 'Frequency Probe',
    creditCost: 400,
    effectType: 'probe_parity',
    description: 'Probes carrier bus to calculate whether code digit sum is even or odd.',
  },
  'tool-firewall-patch': {
    id: 'tool-firewall-patch',
    name: 'Firewall Patch',
    creditCost: 450,
    effectType: 'firewall_shield',
    description: 'Primes a defensive shield against ICE distortions.',
  },
  'tool-blackout-ping': {
    id: 'tool-blackout-ping',
    name: 'Blackout Ping',
    creditCost: 550,
    effectType: 'blackout_ping',
    description: 'Blinds security telemetry sensors for a safe probe window.',
  },
  'tool-signal-sniffer': {
    id: 'tool-signal-sniffer',
    name: 'Signal Sniffer',
    creditCost: 600,
    effectType: 'detect_duplicates',
    description: 'Probes carrier harmonics to confirm whether digits repeat.',
  },
  'tool-snoop-packet': {
    id: 'tool-snoop-packet',
    name: 'Snoop Packet',
    creditCost: 750,
    effectType: 'eliminate_digit',
    description: 'Intercepts carrier packets to unmask a confirmed dead digit.',
  },
  'tool-trace-accelerator': {
    id: 'tool-trace-accelerator',
    name: 'Trace Accelerator',
    creditCost: 800,
    effectType: 'add_time',
    description: 'Injects delay cycles, adding 10 seconds to the countdown clock.',
  },
  'tool-false-flag-echo': {
    id: 'tool-false-flag-echo',
    name: 'False Flag Echo',
    creditCost: 1100,
    effectType: 'false_flag_echo',
    description: 'Emits a decoy trace signature to confuse defensive ICE.',
  },
};

export interface ApplyTerminalToolParams {
  toolId: string;
  secret: string;
  eliminatedDigits?: string[];
  hasIceShield?: boolean;
  timerSeconds?: number;
}

export interface TerminalToolResult {
  success: boolean;
  toolId?: string;
  effectType?: string;
  eliminatedDigit?: string;
  hasDuplicates?: boolean;
  shieldArmed?: boolean;
  timeAddedSeconds?: number;
  message?: string;
  error?: string;
}

export function applyTerminalTool(params: ApplyTerminalToolParams): TerminalToolResult {
  const { toolId, secret, eliminatedDigits = [] } = params;
  const rule = TERMINAL_TOOL_RULES[toolId];

  if (!rule) {
    return {
      success: false,
      error: `Unknown terminal tool: ${toolId}`,
    };
  }

  const allDigits = '0123456789'.split('');

  switch (rule.effectType) {
    case 'eliminate_digit': {
      // Find candidate dead digits not in secret and not yet eliminated
      const candidateDead = allDigits.filter(
        (d) => !secret.includes(d) && !eliminatedDigits.includes(d)
      );

      if (candidateDead.length === 0) {
        return {
          success: true,
          toolId,
          effectType: 'eliminate_digit',
          message: 'All non-code digits have already been identified.',
        };
      }

      // Pick one dead digit deterministically or lowest available
      const eliminated = candidateDead[0];
      return {
        success: true,
        toolId,
        effectType: 'eliminate_digit',
        eliminatedDigit: eliminated,
        message: `${rule.name} deployed: Digit [${eliminated}] confirmed dead and purged from keypad.`,
      };
    }

    case 'firewall_shield': {
      return {
        success: true,
        toolId,
        effectType: 'firewall_shield',
        shieldArmed: true,
        message: `${rule.name} armed: Defensive shield primed. Next ICE distortion neutralised.`,
      };
    }

    case 'add_time': {
      return {
        success: true,
        toolId,
        effectType: 'add_time',
        timeAddedSeconds: 10,
        message: `${rule.name} injected: +10 seconds added to security lockdown clock.`,
      };
    }

    case 'detect_duplicates': {
      const secretDigits = secret.split('');
      const uniqueDigits = new Set(secretDigits);
      const hasDuplicates = uniqueDigits.size !== secretDigits.length;

      return {
        success: true,
        toolId,
        effectType: 'detect_duplicates',
        hasDuplicates,
        message: hasDuplicates
          ? 'Signal Sniffer probe: Duplicate digits detected in the target code!'
          : 'Signal Sniffer probe: Confirmed all digits in the target code are unique.',
      };
    }

    case 'probe_parity': {
      const sum = secret.split('').reduce((acc, ch) => acc + parseInt(ch, 10), 0);
      const isEven = sum % 2 === 0;
      return {
        success: true,
        toolId,
        effectType: 'probe_parity',
        message: `Frequency Probe: Carrier bus harmonic confirmed digit sum is ${isEven ? 'EVEN' : 'ODD'} (${isEven ? '2n' : '2n+1'}).`,
      };
    }

    case 'blackout_ping': {
      return {
        success: true,
        toolId,
        effectType: 'blackout_ping',
        message: `${rule.name} pulsed: Terminal telemetry blindspot active.`,
      };
    }

    case 'false_flag_echo': {
      return {
        success: true,
        toolId,
        effectType: 'false_flag_echo',
        message: `${rule.name} transmitted: Decoy trace echo deployed to ICE daemon.`,
      };
    }

    default:
      return {
        success: false,
        error: `Unhandled tool effect: ${rule.effectType}`,
      };
  }
}
