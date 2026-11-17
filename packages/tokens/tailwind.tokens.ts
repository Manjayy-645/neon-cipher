export const tokens = {
  colors: {
    ink: { DEFAULT: "var(--ink)", muted: "var(--ink-muted)", onDark: "var(--ink-on-dark)" },
    panel: { DEFAULT: "var(--surface-panel)", light: "var(--surface-panel-light)", dark: "var(--surface-dark)" },
    line: "var(--line)",
    accent: { DEFAULT: "var(--accent)", text: "var(--accent-text)", on: "var(--on-accent)" },
    money: { DEFAULT: "var(--money)", text: "var(--money-text)" },
    danger: { DEFAULT: "var(--danger)", text: "var(--danger-text)" },
    status: {
      available: "var(--status-available)",
      owned: "var(--status-owned)",
      contested: "var(--status-contested)",
      cooldown: "var(--status-cooldown)",
    },
    heat: { fill: "var(--heat-fill)", track: "var(--heat-track)" },
    overlay: { slums: "var(--overlay-slums)", commercial: "var(--overlay-commercial)", haze: "var(--overlay-haze-locked)", hazeLocked: "var(--overlay-haze-locked)", fogTint: "var(--overlay-fog-tint)" },
    terminal: {
      bg: "var(--terminal-bg)",
      panel: "var(--terminal-panel)",
      line: "var(--terminal-line)",
      ink: "var(--terminal-ink)",
      muted: "var(--terminal-muted)",
      phosphor: "var(--terminal-phosphor)",
      amber: "var(--terminal-amber)",
      danger: "var(--terminal-danger)"
    }
  },
  borderRadius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    pill: "var(--radius-pill)"
  },
  boxShadow: {
    marker: "var(--shadow-marker)",
    card: "var(--shadow-card)",
    sheet: "var(--shadow-sheet)",
    none: "none"
  },
  fontSize: {
    label: ["11px", { lineHeight: "14px", letterSpacing: "1.5px" }],
    body: ["14px", { lineHeight: "20px" }],
    value: ["15px", { lineHeight: "20px" }],
    title: ["21px", { lineHeight: "23px" }],
    "screen-title": ["28px", { lineHeight: "32px" }],
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "20px",
    xl: "28px",
    xxl: "40px"
  },
  fontFamily: {
    heading: ["var(--font-heading)", "Georgia", "serif"],
    data: ["var(--font-data)", "ui-monospace", "monospace"],
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "24px",
    6: "32px",
    touch: "var(--touch-min)",
    nav: "var(--nav-height)",
    hud: "var(--hud-height)"
  },
  zIndex: {
    'map-canvas': 'var(--z-map-canvas)',
    'map-markers': 'var(--z-map-markers)',
    'map-controls': 'var(--z-map-controls)',
    'nix-pip': 'var(--z-nix-pip)',
    'bottom-sheet': 'var(--z-bottom-sheet)',
    'reminder': 'var(--z-reminder)',
    'modal-backdrop': 'var(--z-modal-backdrop)',
    'modal-surface': 'var(--z-modal-surface)',
    'critical-toast': 'var(--z-critical-toast)',
    'hud-bars': 'var(--z-hud-bars)',
    'terminal-modal': 'var(--z-terminal-modal)',
    'tooltip-inspector': 'var(--z-tooltip-inspector)',
  },
};
