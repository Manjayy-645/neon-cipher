'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Tier1VendingStatic from './skins/Tier1Vending';
import Tier2AtmStatic from './skins/Tier2Atm';
import Tier3CorporateStatic from './skins/Tier3Corporate';
import Tier4VaultStatic from './skins/Tier4Vault';
import Tier5MainframeStatic from './skins/Tier5Mainframe';

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

const Tier1VendingSkin = isTest ? Tier1VendingStatic : dynamic(() => import('./skins/Tier1Vending'), { ssr: false });
const Tier2AtmSkin = isTest ? Tier2AtmStatic : dynamic(() => import('./skins/Tier2Atm'), { ssr: false });
const Tier3CorporateSkin = isTest ? Tier3CorporateStatic : dynamic(() => import('./skins/Tier3Corporate'), { ssr: false });
const Tier4VaultSkin = isTest ? Tier4VaultStatic : dynamic(() => import('./skins/Tier4Vault'), { ssr: false });
const Tier5MainframeSkin = isTest ? Tier5MainframeStatic : dynamic(() => import('./skins/Tier5Mainframe'), { ssr: false });

export interface TerminalFrameProps {
  tier: number;
  children: React.ReactNode;
}

export const TerminalFrame: React.FC<TerminalFrameProps> = ({ tier, children }) => {
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none">
      {/* Dynamic Tier Skins */}
      {tier === 1 && <Tier1VendingSkin />}
      {tier === 2 && <Tier2AtmSkin />}
      {tier === 3 && <Tier3CorporateSkin />}
      {tier === 4 && <Tier4VaultSkin />}
      {tier >= 5 && <Tier5MainframeSkin />}

      {/* Terminal Core Content (same layout bounds for all skins to prevent layout shifts) */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0 w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};
