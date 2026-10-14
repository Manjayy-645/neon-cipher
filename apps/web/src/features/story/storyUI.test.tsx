import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CHAPTERS, getChapterById } from '@neon-cipher/game-rules/src/index';
import { NarrativeBriefing } from './NarrativeBriefing';
import { ChapterSelect } from './ChapterSelect';
import { TutorialOverlay } from './TutorialOverlay';
import { MapTutorialHost } from './MapTutorialHost';
import { useCampaignStore } from '@/stores/campaign-store';
import { useMapStore } from '@/stores/map-store';
import { campaignService } from './campaignService';

describe('Task 10: NarrativeBriefing UI Component', () => {
  const chapter1 = getChapterById('chapter-1')!;

  beforeEach(() => {
    vi.spyOn(campaignService, 'getCampaign').mockResolvedValue({
      debt: { initial: 10000, current: 10000, paid: 0 },
      chapters: {
        'chapter-1': { id: 'chapter-1', status: 'available' },
        'chapter-2': { id: 'chapter-2', status: 'locked' },
        'chapter-3': { id: 'chapter-3', status: 'locked' },
        'chapter-4': { id: 'chapter-4', status: 'locked' },
      },
      activeChapterId: 'chapter-1',
      unlocks: { blackMarket: false, onlinePlay: false, bridge: false },
      tutorials: {
        'chapter-1': { completed: false, skipped: false },
        'chapter-2': { completed: false, skipped: false },
      },
    });

    useCampaignStore.setState({
      debt: { initial: 10000, current: 10000, paid: 0 },
    });
  });

  it('renders large portrait, speaker name, and dialogue card', () => {
    const handleAccept = vi.fn();
    render(<NarrativeBriefing chapter={chapter1} onAccept={handleAccept} />);

    expect(screen.getByTestId('narrative-briefing-screen')).toBeInTheDocument();
    expect(screen.getByTestId('briefing-portrait')).toBeInTheDocument();
    expect(screen.getByText(/Glitch/i)).toBeInTheDocument();
    expect(screen.getByTestId('typewriter-dialogue-box')).toBeInTheDocument();
  });

  it('displays contract terms, specs, and creditor details', () => {
    const handleAccept = vi.fn();
    render(<NarrativeBriefing chapter={chapter1} onAccept={handleAccept} />);

    expect(screen.getByTestId('contract-terms')).toBeInTheDocument();
    expect(screen.getByText(/CONTRACT TARGET \/\/ Rusty Soda Machine/i)).toBeInTheDocument();
    expect(screen.getByText('Kovacs Loan Syndicate', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('$120')).toBeInTheDocument(); // Bounty
  });

  it('displays debt balance progress bar with initial debt and remaining balance', () => {
    const handleAccept = vi.fn();
    render(<NarrativeBriefing chapter={chapter1} onAccept={handleAccept} />);

    expect(screen.getByTestId('debt-progress-box')).toBeInTheDocument();
    expect(screen.getByText(/\$10,000 REMAINING/i)).toBeInTheDocument();
    expect(screen.getByText(/-\$1,500 DEBT/i)).toBeInTheDocument();
  });

  it('allows skipping typewriter text and triggers ACCEPT ASSIGNMENT', () => {
    const handleAccept = vi.fn();
    render(<NarrativeBriefing chapter={chapter1} onAccept={handleAccept} />);

    // Click typewriter box to complete/skip line
    const dialogueBox = screen.getByTestId('typewriter-dialogue-box');
    fireEvent.click(dialogueBox);

    // Accept button
    const acceptBtn = screen.getByTestId('accept-assignment-button');
    expect(acceptBtn).toBeInTheDocument();
    fireEvent.click(acceptBtn);
    expect(handleAccept).toHaveBeenCalledTimes(1);
  });
});

describe('Task 10: ChapterSelect & Debt Tracker Component', () => {
  beforeEach(() => {
    useCampaignStore.setState({
      debt: { initial: 10000, current: 10000, paid: 0 },
      chapters: {
        'chapter-1': { id: 'chapter-1', status: 'available' },
        'chapter-2': { id: 'chapter-2', status: 'locked' },
        'chapter-3': { id: 'chapter-3', status: 'locked' },
        'chapter-4': { id: 'chapter-4', status: 'locked' },
      },
      unlocks: { blackMarket: false, onlinePlay: false, bridge: false },
    });
  });

  it('renders the debt tracker with principal balance', () => {
    render(<ChapterSelect onSelectChapter={vi.fn()} />);

    expect(screen.getByTestId('campaign-debt-tracker')).toBeInTheDocument();
    expect(screen.getByText(/\$10,000 REMAINING/i)).toBeInTheDocument();
  });

  it('displays all 4 chapters with unlock states and unlock milestone badges', () => {
    render(<ChapterSelect onSelectChapter={vi.fn()} />);

    expect(screen.getByTestId('chapter-card-chapter-1')).toBeInTheDocument();
    expect(screen.getByTestId('chapter-card-chapter-2')).toBeInTheDocument();
    expect(screen.getByTestId('chapter-card-chapter-3')).toBeInTheDocument();
    expect(screen.getByTestId('chapter-card-chapter-4')).toBeInTheDocument();

    // Chapter 2 shows Black Market unlock milestone
    expect(screen.getByText(/UNLOCKS BLACK MARKET/i)).toBeInTheDocument();
    // Chapter 4 shows Online Play unlock milestone
    expect(screen.getByText(/UNLOCKS ONLINE PLAY/i)).toBeInTheDocument();
  });

  it('allows clicking an available chapter to open its briefing', () => {
    const handleSelect = vi.fn();
    render(<ChapterSelect onSelectChapter={handleSelect} />);

    const selectBtn = screen.getByTestId('select-chapter-button-chapter-1');
    fireEvent.click(selectBtn);
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'chapter-1' }));
  });
});

describe('Task 10: Guided Tutorial Overlay Component', () => {
  const chapter1 = getChapterById('chapter-1')!;
  const step1 = chapter1.tutorialSteps![0]; // map select node

  beforeEach(() => {
    // Create dummy DOM node matching step1 target selector
    document.body.innerHTML = `
      <div data-marker-id="n1" style="width: 50px; height: 50px; position: absolute; top: 100px; left: 100px;">
        Soda Machine Marker
      </div>
    `;
  });

  it('renders spotlight on target element and Nix speech bubble', () => {
    const handleAdvance = vi.fn();
    const handleSkip = vi.fn();

    render(
      <TutorialOverlay
        chapter={chapter1}
        activeStep={step1}
        currentStepIndex={0}
        onAdvanceStep={handleAdvance}
        onSkipTutorial={handleSkip}
      />
    );

    expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('nix-tutorial-bubble')).toBeInTheDocument();
    expect(screen.getByText(/NIX \/\/ TACTICAL GUIDE/i)).toBeInTheDocument();
    expect(screen.getByText(step1.nixDialogue)).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-overlay').className).toContain('pointer-events-none');
    expect(screen.getAllByTestId('tutorial-backdrop-guard')).toHaveLength(4);
    expect(screen.getByTestId('tutorial-target-highlight')).toHaveAttribute(
      'aria-label',
      `Nix target: ${step1.title}`
    );
  });

  it('spots the JACK IN control for the establish-link step', () => {
    const step2 = chapter1.tutorialSteps![1];
    document.body.innerHTML = '<button data-tutorial="jack-in">JACK IN</button>';

    render(
      <TutorialOverlay
        chapter={chapter1}
        activeStep={step2}
        currentStepIndex={1}
        onAdvanceStep={vi.fn()}
        onSkipTutorial={vi.fn()}
      />
    );

    expect(screen.getByTestId('tutorial-target-highlight')).toHaveAttribute(
      'aria-label',
      'Nix target: ESTABLISH LINK'
    );
  });

  it('keeps the screen interactive if a tutorial target cannot be found', () => {
    const step2 = chapter1.tutorialSteps![1];
    document.body.innerHTML = '';

    render(
      <TutorialOverlay
        chapter={chapter1}
        activeStep={step2}
        currentStepIndex={1}
        onAdvanceStep={vi.fn()}
        onSkipTutorial={vi.fn()}
      />
    );

    expect(screen.queryByTestId('tutorial-target-highlight')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tutorial-backdrop-guard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tutorial-curtain')).not.toBeInTheDocument();
  });

  it('provides an escape hatch ("Skip tutorial") that triggers onSkipTutorial', () => {
    const handleAdvance = vi.fn();
    const handleSkip = vi.fn();

    render(
      <TutorialOverlay
        chapter={chapter1}
        activeStep={step1}
        currentStepIndex={0}
        onAdvanceStep={handleAdvance}
        onSkipTutorial={handleSkip}
      />
    );

    const skipBtn = screen.getByTestId('skip-tutorial-button');
    expect(skipBtn).toBeInTheDocument();
    fireEvent.click(skipBtn);
    expect(handleSkip).toHaveBeenCalledTimes(1);
  });
});

describe('Task 10: MapTutorialHost Component', () => {
  beforeEach(() => {
    useCampaignStore.setState({
      activeChapterId: 'chapter-1',
      tutorialActive: true,
      tutorialStepIndex: 0,
    });
    useMapStore.setState({
      view: 'overview',
      selectedDistrict: null,
      activeNodeId: null,
      selectedNodeId: null,
    });
  });

  it('opens the target node district before asking the player to tap its marker', async () => {
    await act(async () => {
      render(<MapTutorialHost />);
    });

    await waitFor(() => {
      expect(useMapStore.getState().view).toBe('district');
      expect(useMapStore.getState().selectedDistrict).toBe('slums');
    });
  });

  it('restores and expands the target node sheet when resuming at the JACK IN step', async () => {
    useCampaignStore.setState({ tutorialStepIndex: 1 });

    await act(async () => {
      render(<MapTutorialHost />);
    });

    await waitFor(() => {
      expect(useMapStore.getState().activeNodeId).toBe('n1');
      expect(useMapStore.getState().selectedNodeId).toBe('n1');
      expect(useMapStore.getState().view).toBe('node');
      expect(useMapStore.getState().sheetState).toBe('half');
    });
  });

  it('renders tutorial overlay when tutorialActive and step is in map phase', async () => {
    await act(async () => {
      render(<MapTutorialHost />);
    });
    expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('nix-tutorial-bubble')).toBeInTheDocument();
  });

  it('auto-advances tutorial step via useEffect when required node is selected without setState in render', async () => {
    let rerenderFn: any;
    await act(async () => {
      const { rerender } = render(<MapTutorialHost />);
      rerenderFn = rerender;
    });
    expect(useCampaignStore.getState().tutorialStepIndex).toBe(0);

    // Select the chapter 1 node (n1)
    await act(async () => {
      useMapStore.setState({ selectedNodeId: 'n1' });
      rerenderFn(<MapTutorialHost />);
    });

    await waitFor(() => {
      expect(useCampaignStore.getState().tutorialStepIndex).toBe(1);
    });
  });

  it('does not render when tutorialActive is false', async () => {
    useCampaignStore.setState({ tutorialActive: false });
    let containerEl: HTMLElement | null = null;
    await act(async () => {
      const { container } = render(<MapTutorialHost />);
      containerEl = container;
    });
    expect(containerEl).toBeEmptyDOMElement();
  });
});
