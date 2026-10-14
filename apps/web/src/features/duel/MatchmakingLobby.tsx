'use client';

import React, { useState, useEffect } from 'react';
import { useDuelStore } from '@/stores/duel-store';
import { usePlayerStore } from '@/stores/player-store';
import { DuelMatchType, DuelRoom } from './types';
import { calculateDuelPot } from '@neon-cipher/game-rules';
import { Button } from '@/components/ui/Button';

export function MatchmakingLobby() {
  const {
    rooms,
    selectedMatchType,
    selectedPacingMode,
    wager,
    isLoading,
    error,
    fetchRooms,
    createRoom,
    startQuickDuel,
    joinRoom,
    setMatchType,
    setPacingMode,
    setWager,
  } = useDuelStore();

  const { credits } = usePlayerStore();

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const potCalc = calculateDuelPot(wager);
  const ante = wager > 0 ? Math.floor(wager * 0.1) : 0;
  const totalCost = wager + ante;
  const canAfford = credits >= totalCost;

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      await createRoom(newRoomName.trim());
      setIsCreatingRoom(false);
      setNewRoomName('');
    } catch {
      // Error handled by store
    }
  };

  return (
    <div
      data-surface="lobby"
      className="w-full max-w-xl mx-auto flex flex-col gap-5 p-4 sm:p-6 bg-panel-light text-ink"
    >
      {/* Header with Network Status and Wallet */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="font-data text-[10px] tracking-widest text-accent-text uppercase font-bold">
            P2P CARRIER ACTIVE // ENCRYPTED MESH
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            MATCHMAKING LOBBY
          </h1>
          <p className="font-data text-xs text-ink-muted">
            1v1 Live Cipher Duels vs Deckers & Synthetic Opponents
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-panel px-3 py-1.5 rounded-sm border border-line">
          <span className="font-data text-[10px] uppercase text-ink-muted">BANKROLL:</span>
          <span className="font-data text-xs font-bold text-money-text">
            {credits.toLocaleString()} CR
          </span>
        </div>
      </header>

      {/* Error Notice */}
      {error && (
        <div
          role="alert"
          className="p-3 bg-danger/10 border border-danger rounded-sm font-data text-xs text-danger-text"
        >
          {error}
        </div>
      )}

      {/* Match Type Selector (Casual / High-stakes Wager / Turf War) */}
      <section aria-label="Match Type Selection" className="flex flex-col gap-2">
        <label className="font-data text-[11px] font-bold text-ink-muted uppercase tracking-wider">
          SELECT PROTOCOL / MATCH TYPE
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'casual', label: 'Casual', badge: 'No Wager' },
              { id: 'wager', label: 'Wager', badge: 'High Stakes' },
              { id: 'turf', label: 'Turf War', badge: 'Territory' },
            ] as const
          ).map((type) => (
            <Button
              key={type.id}
              variant={selectedMatchType === type.id ? 'secondary' : 'ghost'}
              onClick={() => setMatchType(type.id as DuelMatchType)}
              data-testid={`match-type-${type.id}`}
              className={`min-h-[48px] p-2 flex flex-col items-center justify-center normal-case tracking-normal ${
                selectedMatchType === type.id
                  ? 'border-accent ring-1 ring-accent text-ink font-bold shadow-card'
                  : 'text-ink-muted font-medium'
              }`}
            >
              <span className="font-data text-xs uppercase">{type.label}</span>
              <span className="font-data text-[9px] text-accent-text">{type.badge}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Pacing Mode Selector (Speed Race vs Tactical Turns) */}
      <section aria-label="Pacing Mode Selection" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-data text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            PACING MODE
          </label>
          <span className="font-data text-[10px] text-accent-text font-bold uppercase tracking-wider">
            {selectedPacingMode === 'simultaneous' ? '⚡ Realtime Race' : '⏱️ 20s Tactical Turns'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={selectedPacingMode === 'simultaneous' ? 'secondary' : 'ghost'}
            onClick={() => setPacingMode('simultaneous')}
            data-testid="pacing-mode-simultaneous"
            className={`min-h-[48px] p-2 flex flex-col items-center justify-center normal-case tracking-normal ${
              selectedPacingMode === 'simultaneous'
                ? 'border-accent ring-1 ring-accent text-ink font-bold shadow-card'
                : 'text-ink-muted font-medium'
            }`}
          >
            <span className="font-data text-xs uppercase font-bold flex items-center gap-1">
              ⚡ SPEED (SIMULTANEOUS)
            </span>
            <span className="font-data text-[9px] text-ink-muted text-center leading-tight">
              Realtime speed race. Guess at will.
            </span>
          </Button>

          <Button
            type="button"
            variant={selectedPacingMode === 'turn_based' ? 'secondary' : 'ghost'}
            onClick={() => setPacingMode('turn_based')}
            data-testid="pacing-mode-turn-based"
            className={`min-h-[48px] p-2 flex flex-col items-center justify-center normal-case tracking-normal ${
              selectedPacingMode === 'turn_based'
                ? 'border-accent ring-1 ring-accent text-ink font-bold shadow-card'
                : 'text-ink-muted font-medium'
            }`}
          >
            <span className="font-data text-xs uppercase font-bold flex items-center gap-1">
              ⏱️ TACTICAL (TURN-BASED)
            </span>
            <span className="font-data text-[9px] text-ink-muted text-center leading-tight">
              Strict turns. 20s clock per decker.
            </span>
          </Button>
        </div>
      </section>

      {/* Wager Slider & Ante Preview (for Wager & Turf War) */}
      {selectedMatchType !== 'casual' && (
        <section
          aria-label="Wager & Ante Controls"
          className="bg-panel rounded-md border border-line p-4 flex flex-col gap-3 shadow-card"
        >
          <div className="flex items-center justify-between">
            <span className="font-data text-xs font-bold text-ink uppercase">
              WAGER STAKE: {wager.toLocaleString()} CR
            </span>
            <span className="font-data text-[11px] text-money-text font-bold">
              ANTE (10%): +{ante.toLocaleString()} CR
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={wager}
            onChange={(e) => setWager(parseInt(e.target.value, 10))}
            aria-label="Wager slider"
            className="w-full accent-accent cursor-pointer"
          />

          {/* Wager Presets */}
          <div className="flex items-center justify-between gap-1.5">
            {[250, 500, 1000, 2500, 5000].map((preset) => (
              <Button
                key={preset}
                variant={wager === preset ? 'primary' : 'secondary'}
                compact
                onClick={() => setWager(preset)}
                className="px-2.5 text-[10px]"
              >
                {preset} CR
              </Button>
            ))}
          </div>

          {/* Pot Minus Rake Summary (shown BEFORE joining) */}
          <div
            data-testid="pot-preview"
            className="mt-1 p-2.5 rounded-sm bg-panel-light border border-line flex flex-col gap-1 font-data text-xs"
          >
            <div className="flex justify-between text-ink-muted">
              <span>GROSS POT (2x Wager)</span>
              <span className="font-mono font-bold text-ink">{potCalc.totalPot.toLocaleString()} CR</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>SYNDICATE RAKE ({potCalc.rakePercent * 100}%)</span>
              <span className="font-mono text-danger-text">-{potCalc.rake.toLocaleString()} CR</span>
            </div>
            <div className="border-t border-line/60 pt-1 flex justify-between font-bold text-ink">
              <span>NET PAYOUT TO WINNER</span>
              <span className="font-mono text-money-text">+{potCalc.netPot.toLocaleString()} CR</span>
            </div>
            {!canAfford && (
              <div className="mt-1 text-[10px] text-danger-text font-bold flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-danger" aria-hidden="true">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>INSUFFICIENT CREDITS (Required: {totalCost.toLocaleString()} CR with Ante)</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick Jack-In Action */}
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          fullWidth
          onClick={() => startQuickDuel()}
          disabled={isLoading || (!canAfford && selectedMatchType !== 'casual')}
          loading={isLoading}
          data-testid="quick-jack-in-button"
          className="flex items-center justify-center gap-2"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden border border-panel-light/60 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Character portraits/Null_Byte.png" alt="Null_Byte" className="w-full h-full object-cover" />
          </div>
          <span>QUICK JACK-IN (VS NULL_BYTE)</span>
        </Button>

        <div className="flex items-center justify-between pt-1">
          <span className="font-data text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            ACTIVE ROOMS ({rooms.length})
          </span>
          <Button
            variant="ghost"
            compact
            onClick={() => setIsCreatingRoom(!isCreatingRoom)}
            data-testid="open-create-room-button"
            className="text-accent-text"
          >
            + CREATE ROOM
          </Button>
        </div>
      </div>

      {/* Create Room Form Modal/Collapse */}
      {isCreatingRoom && (
        <form
          onSubmit={handleCreateRoom}
          className="p-4 bg-panel rounded-md border border-accent flex flex-col gap-3 shadow-card"
        >
          <div className="font-data text-xs font-bold text-ink uppercase">
            BROADCAST NEW DUEL ROOM
          </div>
          <input
            type="text"
            placeholder="Room identifier (e.g. Neon Grid 01)"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 bg-panel-light border border-line rounded-sm font-data text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              compact
              onClick={() => setIsCreatingRoom(false)}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              variant="primary"
              compact
              disabled={!newRoomName.trim() || isLoading}
              loading={isLoading}
            >
              CREATE
            </Button>
          </div>
        </form>
      )}

      {/* Room List */}
      <section aria-label="Available Rooms" className="flex flex-col gap-2">
        {rooms.length === 0 ? (
          <div className="p-6 text-center bg-panel/30 border border-line/60 rounded-md font-data text-xs text-ink-muted">
            NO OPEN ROOMS ON THE GRID. USE QUICK JACK-IN OR BROADCAST A ROOM.
          </div>
        ) : (
          rooms.map((room) => {
            const isAffordable = credits >= room.wager + room.ante;
            return (
              <div
                key={room.id}
                data-testid={`room-item-${room.id}`}
                className="p-3 bg-panel-light border border-line rounded-md hover:border-accent flex items-center justify-between gap-3 shadow-sm transition-all"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-data text-xs font-bold text-ink">{room.name}</span>
                    <span className="font-data text-[9px] uppercase px-1.5 py-0.5 rounded-sm bg-panel border border-line text-ink-muted">
                      {room.matchType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-data text-[10px] text-ink-muted">
                    <span>HOST: {room.host}</span>
                    <span>WAGER: {room.wager} CR</span>
                    <span className="flex items-center gap-1 font-mono">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          room.pingMs < 30 ? 'bg-accent' : 'bg-amber-500'
                        }`}
                      />
                      {room.pingMs}ms
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  compact
                  onClick={() => joinRoom(room)}
                  disabled={isLoading || (!isAffordable && room.wager > 0)}
                  data-testid={`join-room-${room.id}`}
                >
                  JACK IN
                </Button>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
