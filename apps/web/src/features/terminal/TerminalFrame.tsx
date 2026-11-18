'use client';

import React from 'react';
import styles from './TerminalWorkspace.module.css';
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
  nodeName?: string;
  nodeType?: string;
  children: React.ReactNode;
}

export const TerminalFrame: React.FC<TerminalFrameProps> = ({
  tier,
  nodeName,
  nodeType,
  children,
}) => {
  const skinProps = { nodeName, nodeType };

  const renderSkin = () => {
    if (nodeType) {
      const typeLower = nodeType.toLowerCase();
      if (typeLower === 'vending' || typeLower === 'meter' || typeLower === 'coinbox') {
        return <Tier1VendingSkin {...skinProps} />;
      }
      if (typeLower === 'atm' || typeLower === 'register') {
        return <Tier2AtmSkin {...skinProps} />;
      }
      if (typeLower === 'relay' || typeLower === 'camera') {
        return <Tier3CorporateSkin {...skinProps} />;
      }
      if (typeLower === 'safe') {
        return <Tier4VaultSkin {...skinProps} />;
      }
    }

    if (tier === 1) return <Tier1VendingSkin {...skinProps} />;
    if (tier === 2) return <Tier2AtmSkin {...skinProps} />;
    if (tier === 3) return <Tier3CorporateSkin {...skinProps} />;
    if (tier === 4) return <Tier4VaultSkin {...skinProps} />;
    return <Tier5MainframeSkin {...skinProps} />;
  };

  return (
    <div className={styles.frame}>
      {/* Dynamic Device Chassis Skin */}
      <div className={styles.trim} aria-hidden="true">{renderSkin()}</div>

      {/* Terminal Core Content (same layout bounds for all skins to prevent layout shifts) */}
      <div className={styles.core}>
        {children}
      </div>
    </div>
  );
};
