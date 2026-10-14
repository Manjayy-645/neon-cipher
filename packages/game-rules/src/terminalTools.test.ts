import { describe, it, expect } from 'vitest';
import {
  applyTerminalTool,
  TERMINAL_TOOL_RULES,
  TerminalToolRule,
} from './terminalTools';

describe('Terminal Tools (game-rules)', () => {
  describe('Rule Registry', () => {
    it('contains rules for all standard equipped consumable tools', () => {
      expect(TERMINAL_TOOL_RULES['tool-static-injector']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-firewall-patch']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-snoop-packet']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-trace-accelerator']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-signal-sniffer']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-blackout-ping']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-false-flag-echo']).toBeDefined();
    });
  });

  describe('Static Injector', () => {
    it('eliminates a dead digit not in secret and not already eliminated', () => {
      const secret = '123';
      const eliminated = ['4', '5'];
      const result = applyTerminalTool({
        toolId: 'tool-static-injector',
        secret,
        eliminatedDigits: eliminated,
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('eliminate_digit');
      expect(result.eliminatedDigit).toBeDefined();
      expect(secret.includes(result.eliminatedDigit!)).toBe(false);
      expect(eliminated.includes(result.eliminatedDigit!)).toBe(false);
      expect(result.message).toContain(result.eliminatedDigit!);
    });
  });

  describe('Firewall Patch', () => {
    it('primes a defensive ICE shield', () => {
      const result = applyTerminalTool({
        toolId: 'tool-firewall-patch',
        secret: '456',
        eliminatedDigits: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('firewall_shield');
      expect(result.shieldArmed).toBe(true);
      expect(result.message).toContain('Firewall Patch');
    });
  });

  describe('Trace Accelerator', () => {
    it('adds 10 seconds to the clock', () => {
      const result = applyTerminalTool({
        toolId: 'tool-trace-accelerator',
        secret: '789',
        eliminatedDigits: [],
        timerSeconds: 45,
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('add_time');
      expect(result.timeAddedSeconds).toBe(10);
      expect(result.message).toContain('10 seconds');
    });
  });

  describe('Signal Sniffer', () => {
    it('correctly reports no duplicate digits when digits are unique', () => {
      const result = applyTerminalTool({
        toolId: 'tool-signal-sniffer',
        secret: '381',
        eliminatedDigits: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('detect_duplicates');
      expect(result.hasDuplicates).toBe(false);
      expect(result.message).toContain('unique');
    });

    it('correctly reports duplicate digits when digits repeat', () => {
      const result = applyTerminalTool({
        toolId: 'tool-signal-sniffer',
        secret: '338',
        eliminatedDigits: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('detect_duplicates');
      expect(result.hasDuplicates).toBe(true);
      expect(result.message).toContain('Duplicate');
    });
  });

  describe('Snoop Packet', () => {
    it('unmasks a dead digit from carrier telemetry', () => {
      const secret = '492';
      const result = applyTerminalTool({
        toolId: 'tool-snoop-packet',
        secret,
        eliminatedDigits: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('eliminate_digit');
      expect(result.eliminatedDigit).toBeDefined();
      expect(secret.includes(result.eliminatedDigit!)).toBe(false);
    });
  });

  describe('Frequency Probe', () => {
    it('correctly calculates and reports parity of secret digit sum', () => {
      // 1 + 2 + 3 = 6 (even)
      const evenResult = applyTerminalTool({
        toolId: 'tool-frequency-probe',
        secret: '123',
      });
      expect(evenResult.success).toBe(true);
      expect(evenResult.effectType).toBe('probe_parity');
      expect(evenResult.message).toContain('EVEN');

      // 1 + 2 + 4 = 7 (odd)
      const oddResult = applyTerminalTool({
        toolId: 'tool-frequency-probe',
        secret: '124',
      });
      expect(oddResult.success).toBe(true);
      expect(oddResult.effectType).toBe('probe_parity');
      expect(oddResult.message).toContain('ODD');
    });
  });

  describe('Unknown Tool', () => {
    it('returns error when toolId is not recognized', () => {
      const result = applyTerminalTool({
        toolId: 'non-existent-tool',
        secret: '123',
        eliminatedDigits: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
