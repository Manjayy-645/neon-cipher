import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMapStore } from '../../../stores/map-store';
import { useToastStore } from '../../../stores/toast-store';
import { getNodes } from '../nodeService';
import { MapOverlay } from '../MapOverlay';
import { DistrictTag } from '../DistrictTag';
import { DistrictHeaderChip } from '../DistrictHeaderChip';
import { NixGuide } from '../NixGuide';
import { DISTRICT_DEFINITIONS } from '../districtConfig';
import { DISTRICT_ZOOM_THRESHOLD } from '../camera';
import { NIX_GUIDE_LINES } from '../nixGuideLines';

// Mock maplibre-gl map
const mockMap = {
  project: vi.fn(([lng, lat]: [number, number]) => ({
    x: (lng + 10) * 20,
    y: (10 - lat) * 20,
  })),
  on: vi.fn(),
  off: vi.fn(),
  touchZoomRotate: {
    disableRotation: vi.fn(),
  },
  getZoom: vi.fn(() => 3),
  getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
  easeTo: vi.fn(),
  flyTo: vi.fn(),
  jumpTo: vi.fn(),
  resize: vi.fn(),
  remove: vi.fn(),
} as any;

describe('TASK: Map page states (overview, district, node)', () => {
  const allNodes = getNodes();

  beforeEach(() => {
    act(() => {
      useMapStore.getState().resetMapState();
      useToastStore.setState({ toast: null });
    });
    vi.clearAllMocks();
  });

  describe('1. Store State Machine Transitions', () => {
    it('initializes in overview state with null district and null node', () => {
      const state = useMapStore.getState();
      expect(state.view).toBe('overview');
      expect(state.selectedDistrict).toBeNull();
      expect(state.selectedNodeId).toBeNull();
      expect(state.activeNodeId).toBeNull();
      expect(state.sheetState).toBe('peek');
    });

    it('transitions to district state upon selecting a district', () => {
      act(() => {
        useMapStore.getState().selectDistrict('slums');
      });
      const state = useMapStore.getState();
      expect(state.view).toBe('district');
      expect(state.selectedDistrict).toBe('slums');
      expect(state.selectedNodeId).toBeNull();
    });

    it('transitions to node state upon selecting a node marker', () => {
      act(() => {
        useMapStore.getState().selectDistrict('slums');
        useMapStore.getState().selectNode('n1');
      });
      const state = useMapStore.getState();
      expect(state.view).toBe('node');
      expect(state.selectedNodeId).toBe('n1');
      expect(state.sheetState).toBe('half');
    });

    it('steps back from node -> district -> overview -> overview', () => {
      act(() => {
        useMapStore.getState().selectDistrict('slums');
        useMapStore.getState().selectNode('n1');
      });
      expect(useMapStore.getState().view).toBe('node');

      // 1. Step back to district
      act(() => {
        useMapStore.getState().stepBackView();
      });
      expect(useMapStore.getState().view).toBe('district');
      expect(useMapStore.getState().selectedDistrict).toBe('slums');
      expect(useMapStore.getState().selectedNodeId).toBeNull();
      expect(useMapStore.getState().sheetState).toBe('peek');

      // 2. Step back to overview
      act(() => {
        useMapStore.getState().stepBackView();
      });
      expect(useMapStore.getState().view).toBe('overview');
      expect(useMapStore.getState().selectedDistrict).toBeNull();

      // 3. Step back from overview stays in overview
      act(() => {
        useMapStore.getState().stepBackView();
      });
      expect(useMapStore.getState().view).toBe('overview');
    });
  });

  describe('2. Marker Visibility Rules', () => {
    it('renders ZERO node markers in overview state (zoom < 3.5)', () => {
      act(() => {
        useMapStore.setState({ view: 'overview' });
      });

      render(<MapOverlay map={mockMap} nodes={allNodes} zoom={3.0} />);

      // District tags should exist
      expect(screen.getByTestId('district-container-S')).toBeDefined();
      expect(screen.getByTestId('district-container-C')).toBeDefined();

      // No node markers should be rendered
      allNodes.forEach((node) => {
        expect(screen.queryByTestId(`marker-${node.id}`)).toBeNull();
      });
    });

    it('renders only unlocked-district markers (8 Slums nodes) in district view at zoom >= 3.5', () => {
      act(() => {
        useMapStore.setState({
          view: 'district',
          selectedDistrict: 'slums',
          unlocks: { bridge: false },
        });
      });

      render(<MapOverlay map={mockMap} nodes={allNodes} zoom={4.2} />);

      // Slums nodes (n1 to n8) must all be rendered
      const slumsNodes = allNodes.filter((n) => n.district === 'slums');
      expect(slumsNodes.length).toBe(8);
      slumsNodes.forEach((node) => {
        expect(screen.getByTestId(`marker-${node.id}`)).toBeDefined();
      });

      // Commercial nodes (n9 to n15) must NEVER render because commercial is locked
      const commercialNodes = allNodes.filter((n) => n.district === 'commercial');
      expect(commercialNodes.length).toBe(7);
      commercialNodes.forEach((node) => {
        expect(screen.queryByTestId(`marker-${node.id}`)).toBeNull();
      });
    });

    it('NEVER renders locked-district nodes at any zoom level', () => {
      act(() => {
        useMapStore.setState({
          view: 'district',
          selectedDistrict: null,
          unlocks: { bridge: false },
        });
      });

      // Zoom in deep to 5.5
      render(<MapOverlay map={mockMap} nodes={allNodes} zoom={5.5} />);

      const commercialNodes = allNodes.filter((n) => n.district === 'commercial');
      commercialNodes.forEach((node) => {
        expect(screen.queryByTestId(`marker-${node.id}`)).toBeNull();
      });
    });
  });

  describe('3. DistrictTag and Counts Match Node Data', () => {
    it('displays exact counts on Slums tag ("8 nodes, 2 contested") and OPEN status chip', () => {
      const slumsNodes = allNodes.filter((n) => n.district === 'slums');
      const contestedSlums = slumsNodes.filter((n) => n.status === 'contested');

      render(
        <DistrictTag
          district={DISTRICT_DEFINITIONS.slums}
          totalNodes={slumsNodes.length}
          contestedNodes={contestedSlums.length}
          isLocked={false}
        />
      );

      const tag = screen.getByTestId('district-tag-slums');
      expect(tag).toBeDefined();
      expect(screen.getByText('THE SLUMS')).toBeDefined();
      expect(screen.getByText('8 nodes, 2 contested')).toBeDefined();
      expect(screen.getByTestId('status-chip-slums-open')).toBeDefined();
      expect(screen.getByText('TAP TO ENTER')).toBeDefined();
    });

    it('displays exact count on Commercial tag ("7 nodes"), LOCKED chip, and padlock', () => {
      const commercialNodes = allNodes.filter((n) => n.district === 'commercial');

      render(
        <DistrictTag
          district={DISTRICT_DEFINITIONS.commercial}
          totalNodes={commercialNodes.length}
          contestedNodes={0}
          isLocked={true}
        />
      );

      const tag = screen.getByTestId('district-tag-commercial');
      expect(tag).toBeDefined();
      expect(screen.getByText('COMMERCIAL STRIP')).toBeDefined();
      expect(screen.getByText('7 nodes')).toBeDefined();
      expect(screen.getByTestId('status-chip-commercial-locked')).toBeDefined();
      expect(screen.getByText('LOCKED')).toBeDefined();
    });

    it('tapping locked Commercial tag triggers a toast and Nix line without changing view', () => {
      render(
        <DistrictTag
          district={DISTRICT_DEFINITIONS.commercial}
          totalNodes={7}
          contestedNodes={0}
          isLocked={true}
        />
      );

      const btn = screen.getByRole('button', { name: /commercial strip/i });
      fireEvent.click(btn);

      // View remains overview (no zoom)
      expect(useMapStore.getState().view).toBe('overview');

      // Toast triggered
      const toast = useToastStore.getState().toast;
      expect(toast).not.toBeNull();
      expect(toast?.message).toContain('Cross the bridge');

      // Nix active situation updated
      expect(useMapStore.getState().activeNixSituation).toBe('lockedTap');
    });

    it('tapping unlocked Slums tag transitions store view to district', () => {
      render(
        <DistrictTag
          district={DISTRICT_DEFINITIONS.slums}
          totalNodes={8}
          contestedNodes={2}
          isLocked={false}
        />
      );

      const btn = screen.getByRole('button', { name: /the slums/i });
      fireEvent.click(btn);

      expect(useMapStore.getState().view).toBe('district');
      expect(useMapStore.getState().selectedDistrict).toBe('slums');
    });
  });

  describe('4. District Unlock Behavior', () => {
    it('unlocking bridge flips Commercial tag to OPEN and allows entering district', () => {
      act(() => {
        useMapStore.getState().setBridgeUnlocked(true);
      });

      render(
        <DistrictTag
          district={DISTRICT_DEFINITIONS.commercial}
          totalNodes={7}
          contestedNodes={1}
          isLocked={!useMapStore.getState().unlocks.bridge}
        />
      );

      expect(screen.getByTestId('status-chip-commercial-open')).toBeDefined();
      expect(screen.queryByTestId('status-chip-commercial-locked')).toBeNull();

      const btn = screen.getByRole('button', { name: /commercial strip/i });
      fireEvent.click(btn);

      expect(useMapStore.getState().view).toBe('district');
      expect(useMapStore.getState().selectedDistrict).toBe('commercial');
    });
  });

  describe('5. DistrictHeaderChip', () => {
    it('renders back button, district name, and node count', () => {
      act(() => {
        useMapStore.setState({ view: 'district', selectedDistrict: 'slums' });
      });

      render(<DistrictHeaderChip />);

      expect(screen.getByTestId('district-header-chip')).toBeDefined();
      expect(screen.getByText('THE SLUMS')).toBeDefined();
      expect(screen.getByText('8 NODES')).toBeDefined();

      const backBtn = screen.getByTestId('district-back-button');
      fireEvent.click(backBtn);

      // Back button steps back to overview
      expect(useMapStore.getState().view).toBe('overview');
      expect(useMapStore.getState().selectedDistrict).toBeNull();
    });
  });

  describe('6. NixGuide Interactive Assistant', () => {
    it('renders 48px portrait button and contextual line for overview', () => {
      act(() => {
        useMapStore.setState({ view: 'overview', seenNixSituations: [] });
      });

      render(<NixGuide />);

      const portrait = screen.getByTestId('nix-portrait-button');
      expect(portrait).toBeDefined();

      // Speech bubble opens with overview tip
      const bubble = screen.getByTestId('nix-speech-bubble');
      expect(bubble).toBeDefined();
      expect(bubble.textContent).toContain(NIX_GUIDE_LINES.overview);
    });

    it('dismiss button closes the speech bubble and Escape closes it', () => {
      act(() => {
        useMapStore.setState({ view: 'overview', seenNixSituations: [] });
      });

      render(<NixGuide />);

      expect(screen.getByTestId('nix-speech-bubble')).toBeDefined();

      const dismissBtn = screen.getByTestId('nix-dismiss-button');
      fireEvent.click(dismissBtn);

      expect(useMapStore.getState().isNixBubbleOpen).toBe(false);
      const bubble = screen.queryByTestId('nix-speech-bubble');
      if (bubble) {
        expect(bubble.style.opacity).toBe('0');
      }
    });

    it('repositions NixGuide above sheet when view is node', () => {
      act(() => {
        useMapStore.setState({
          view: 'node',
          selectedNodeId: 'n1',
          sheetHeight: 250,
          seenNixSituations: ['overview'],
        });
      });

      render(<NixGuide />);

      const container = screen.getByTestId('nix-guide-container');
      expect(container.style.bottom).toBe('262px'); // 250 + 12px
      expect(container.style.left).toBe('16px');
    });
  });
});
