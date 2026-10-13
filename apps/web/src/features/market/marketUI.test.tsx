import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShopkeeperScene } from './ShopkeeperScene';
import { BlackMarket } from './BlackMarket';
import { walletService } from './walletService';

describe('Task 8: Market UI Components', () => {
  beforeEach(() => {
    vi.spyOn(walletService, 'getWallet').mockResolvedValue({
      credits: 12500,
      coins: 45,
      inventory: { 'tool-static-injector': 2 },
      equippedTools: ['tool-static-injector'],
    });
  });

  describe('ShopkeeperScene', () => {
    it('renders vendor name, title, and buttons', () => {
      const onOpen = vi.fn();
      const onLeave = vi.fn();

      render(
        <ShopkeeperScene
          vendorName="GLITCH"
          vendorTitle="BLACK MARKET BROKER"
          onOpenShop={onOpen}
          onLeave={onLeave}
        />
      );

      expect(screen.getByText('GLITCH')).toBeInTheDocument();
      expect(screen.getByText('BLACK MARKET BROKER')).toBeInTheDocument();
      expect(screen.getByText('OPEN BLACK MARKET')).toBeInTheDocument();
      expect(screen.getByText('LEAVE')).toBeInTheDocument();

      fireEvent.click(screen.getByText('OPEN BLACK MARKET'));
      expect(onOpen).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('LEAVE'));
      expect(onLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('BlackMarket UI', () => {
    it('renders 4 tabs and switches between them', async () => {
      const onBack = vi.fn();
      render(<BlackMarket onBackToDialogue={onBack} />);

      expect(screen.getByText('TOOLS')).toBeInTheDocument();
      expect(screen.getByText('EXPLOITS')).toBeInTheDocument();
      expect(screen.getByText('RIG HARDWARE')).toBeInTheDocument();
      expect(screen.getByText('DISTRICT LEASES')).toBeInTheDocument();

      // Tools tab items visible by default
      expect(screen.getByText('Static Injector')).toBeInTheDocument();

      // Click Exploits tab
      fireEvent.click(screen.getByText('EXPLOITS'));
      expect(screen.getByText('Digit Scrub')).toBeInTheDocument();
      expect(screen.getByText('5 Coins')).toBeInTheDocument();

      // Click Rig Hardware tab
      fireEvent.click(screen.getByText('RIG HARDWARE'));
      expect(screen.getByText('Memory Buffer Mk I')).toBeInTheDocument();

      // Click District Leases tab
      fireEvent.click(screen.getByText('DISTRICT LEASES'));
      expect(screen.getByText('Slums Public Node Lease')).toBeInTheDocument();
    });

    it('opens and closes the Coin store offline stub modal', async () => {
      render(<BlackMarket onBackToDialogue={vi.fn()} />);

      // Find the coin button in the header
      const coinBtn = screen.getByLabelText('Open coin exchange');
      fireEvent.click(coinBtn);

      expect(screen.getByText('COIN EXCHANGE OFFLINE')).toBeInTheDocument();
      expect(screen.getByText(/Payments are not enabled in this build/i)).toBeInTheDocument();

      // Return to market button closes modal
      fireEvent.click(screen.getByText('RETURN TO MARKET'));
      await waitFor(() => {
        expect(screen.queryByText('COIN EXCHANGE OFFLINE')).not.toBeInTheDocument();
      });
    });
  });
});
