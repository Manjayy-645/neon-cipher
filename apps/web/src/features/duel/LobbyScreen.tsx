'use client';

import React, { useState, useEffect } from 'react';
import { DuelRoom, DuelMatchType } from './types';
import { duelService } from './duelService';
import { calculateDuelPot } from '@neon-cipher/game-rules/src/index';
import { Button } from '@/components/ui/Button';

export interface LobbyScreenProps {
  playerCredits: number;
  onJoinDuel: (params: { matchType: DuelMatchType; wager: number; ante: number; roomId?: string }) => void;
  isLoading?: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  playerCredits,
  onJoinDuel,
  isLoading = false,
}) => {
  const [matchType, setMatchType] = useState<DuelMatchType>('wager');
  const [wager, setWager] = useState<number>(500);
  const [rooms, setRooms] = useState<DuelRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomWager, setNewRoomWager] = useState(250);
  const [fetchingRooms, setFetchingRooms] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch rooms on mount
  useEffect(() => {
    duelService
      .getRooms()
      .then((data) => setRooms(data))
      .catch((err) => console.error(err))
      .finally(() => setFetchingRooms(false));
  }, []);

  // Update default wager based on match type
  const handleSelectMatchType = (type: DuelMatchType) => {
    setMatchType(type);
    if (type === 'casual') {
      setWager(0);
    } else if (type === 'wager') {
      setWager(500);
    } else if (type === 'turf') {
      setWager(750);
    }
  };

  const ante = wager > 0 ? Math.floor(wager * 0.1) : 0;
  const potCalculation = calculateDuelPot(wager);
  const totalCost = wager + ante;
  const canAfford = playerCredits >= totalCost;

  const handleQuickJackIn = () => {
    if (!canAfford) {
      setErrorMsg(`Insufficient credits. Required: ${totalCost} CR (Wager ${wager} + Ante ${ante})`);
      return;
    }
    setErrorMsg(null);
    onJoinDuel({ matchType, wager, ante });
  };

  const handleJoinSelectedRoom = (room: DuelRoom) => {
    const roomCost = room.wager + room.ante;
    if (playerCredits < roomCost) {
      setErrorMsg(`Insufficient credits for this room. Required: ${roomCost} CR`);
      return;
    }
    setErrorMsg(null);
    onJoinDuel({
      matchType: room.matchType,
      wager: room.wager,
      ante: room.ante,
      roomId: room.id,
    });
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const roomAnte = newRoomWager > 0 ? Math.floor(newRoomWager * 0.1) : 0;
    if (playerCredits < newRoomWager + roomAnte) {
      setErrorMsg('Insufficient credits to sponsor this room ante.');
      return;
    }

    try {
      const created = await duelService.createRoom({
        name: newRoomName.trim(),
        matchType,
        wager: newRoomWager,
        ante: roomAnte,
      });
      setRooms((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewRoomName('');
      handleJoinSelectedRoom(created);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  return (
    <div
      data-testid="duel-lobby-screen"
      className="w-full h-full flex flex-col bg-panel-light text-ink overflow-y-auto p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-line">
        <div className="flex items-center justify-between">
          <span className="font-data text-[10px] tracking-[2px] uppercase text-ink-muted font-bold">
            P2P CIPHER GRID // MATCHMAKING
          </span>
          <span className="font-data text-[12px] text-money-text font-semibold">
            BALANCE: {playerCredits.toLocaleString()} CR
          </span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink tracking-tight">
          1v1 DUEL ARENA
        </h1>
        <p className="font-data text-xs text-ink-muted">
          Crack codes head-to-head against rivals. Wager credits, deploy electronic sabotages, and clean out the pot.
        </p>
      </div>

      {errorMsg && (
        <div
          data-testid="lobby-error-banner"
          className="my-3 p-3 bg-danger/10 border border-danger/30 rounded-sm text-danger-text font-data text-xs flex items-center justify-between"
        >
          <span>{errorMsg}</span>
          <Button
            type="button"
            variant="icon"
            onClick={() => setErrorMsg(null)}
            className="text-danger-text p-1"
            aria-label="Dismiss error"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
        </div>
      )}

      {/* 1. Match Type Selector */}
      <div className="mt-4 flex flex-col gap-2">
        <label className="font-data text-[11px] font-bold uppercase tracking-[1.5px] text-ink-muted">
          SELECT ENGAGEMENT TYPE
        </label>
        <div
          data-testid="match-type-selector"
          className="grid grid-cols-3 gap-2"
        >
          <Button
            type="button"
            variant={matchType === 'casual' ? 'primary' : 'secondary'}
            onClick={() => handleSelectMatchType('casual')}
            data-testid="match-type-casual"
            className="min-h-[48px] p-2 flex flex-col items-center justify-center normal-case tracking-normal"
          >
            <span className="font-bold tracking-wider uppercase font-data text-xs">CASUAL</span>
            <span className={`text-[10px] font-data ${matchType === 'casual' ? 'text-white/80' : 'text-ink-muted'}`}>
              Free / Exploits On
            </span>
          </Button>

          <Button
            type="button"
            variant={matchType === 'wager' ? 'primary' : 'secondary'}
            onClick={() => handleSelectMatchType('wager')}
            data-testid="match-type-wager"
            className="min-h-[48px] p-2 flex flex-col items-center justify-center normal-case tracking-normal"
          >
            <span className="font-bold tracking-wider uppercase font-data text-xs">HIGH-STAKES</span>
            <span className={`text-[10px] font-data ${matchType === 'wager' ? 'text-white/80' : 'text-ink-muted'}`}>
              Ranked Wager
            </span>
          </Button>

          <Button
            type="button"
            variant={matchType === 'turf' ? 'primary' : 'secondary'}
            onClick={() => handleSelectMatchType('turf')}
            data-testid="match-type-turf"
            className="min-h-[48px] p-2 flex flex-col items-center justify-center normal-case tracking-normal"
          >
            <span className="font-bold tracking-wider uppercase font-data text-xs">TURF WAR</span>
            <span className={`text-[10px] font-data ${matchType === 'turf' ? 'text-white/80' : 'text-ink-muted'}`}>
              Fixed 750 CR
            </span>
          </Button>
        </div>
      </div>

      {/* Wager Slider & Ante Preview */}
      {matchType !== 'casual' && (
        <div
          data-testid="wager-controls"
          className="mt-4 p-4 bg-panel border border-line rounded-sm flex flex-col gap-3 shadow-card"
        >
          <div className="flex items-center justify-between">
            <span className="font-data text-[11px] uppercase tracking-[1px] font-bold text-ink">
              WAGER STAKE: {wager.toLocaleString()} CR
            </span>
            <span className="font-data text-[11px] text-ink-muted">
              ANTE FEE (10%): +{ante} CR
            </span>
          </div>

          {matchType === 'wager' && (
            <div className="flex items-center gap-3">
              <span className="font-data text-xs text-ink-muted">100 CR</span>
              <input
                type="range"
                min="100"
                max={Math.max(100, Math.min(2000, playerCredits))}
                step="50"
                value={wager}
                onChange={(e) => setWager(Number(e.target.value))}
                data-testid="wager-slider"
                aria-label="Duel wager slider"
                className="flex-1 accent-accent h-2 bg-heat-track rounded-lg cursor-pointer"
              />
              <span className="font-data text-xs text-ink-muted">2,000 CR</span>
            </div>
          )}

          {/* POT MINUS RAKE CALCULATION DISPLAY */}
          <div
            data-testid="pot-breakdown"
            className="pt-2 border-t border-line grid grid-cols-3 divide-x divide-line text-center"
          >
            <div className="px-1 flex flex-col">
              <span className="font-data text-[10px] text-ink-muted uppercase">TOTAL POT</span>
              <span className="font-data text-sm font-bold text-ink">
                ${potCalculation.totalPot.toLocaleString()} CR
              </span>
            </div>
            <div className="px-1 flex flex-col">
              <span className="font-data text-[10px] text-ink-muted uppercase">SYNDICATE RAKE (10%)</span>
              <span className="font-data text-sm font-semibold text-danger-text">
                -${potCalculation.rake.toLocaleString()} CR
              </span>
            </div>
            <div className="px-1 flex flex-col">
              <span className="font-data text-[10px] text-accent-text font-bold uppercase">WINNER PAYOUT</span>
              <span className="font-data text-sm font-bold text-money-text">
                ${potCalculation.netPot.toLocaleString()} CR
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Jack-In Action */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={handleQuickJackIn}
          disabled={isLoading || !canAfford}
          loading={isLoading}
          data-testid="quick-jack-in-button"
          className="flex-1 flex items-center justify-center gap-2"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden border border-panel-light/60 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Character portraits/Null_Byte.png" alt="Null_Byte" className="w-full h-full object-cover" />
          </div>
          <span>QUICK JACK-IN (VS NULL_BYTE)</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsCreateModalOpen(true)}
          data-testid="create-room-button"
        >
          + CREATE CUSTOM ROOM
        </Button>
      </div>

      {/* Room List with Ping */}
      <div className="mt-6 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <span className="font-data text-[11px] font-bold uppercase tracking-[1.5px] text-ink-muted">
            AVAILABLE CIPHER ROOMS ({rooms.length})
          </span>
          <span className="font-data text-[11px] text-ink-muted">
            TARGET: NULL_BYTE AI ACTIVE
          </span>
        </div>

        {fetchingRooms ? (
          <div className="p-8 text-center font-data text-xs text-ink-muted">
            Scanning local subnets for peer nodes...
          </div>
        ) : (
          <div data-testid="room-list" className="flex flex-col gap-2">
            {rooms.map((room) => {
              const isSelected = selectedRoomId === room.id;
              const roomPot = calculateDuelPot(room.wager);
              return (
                <div
                  key={room.id}
                  data-testid={`room-item-${room.id}`}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`p-3 rounded-sm border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-panel border-accent shadow-sm'
                      : 'bg-panel-light border-line hover:border-ink-muted'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-bold text-ink truncate">
                        {room.name}
                      </span>
                      <span className="text-[10px] font-data px-1.5 py-0.5 rounded-sm bg-ink/10 text-ink-muted uppercase">
                        {room.matchType}
                      </span>
                    </div>
                    <div className="font-data text-xs text-ink-muted flex items-center gap-2 mt-0.5">
                      <span>Host: {room.host}</span>
                      <span>•</span>
                      <span className="text-money-text font-semibold">
                        Pot: ${roomPot.netPot.toLocaleString()} CR
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Ping indicator */}
                    <div
                      data-testid={`room-ping-${room.id}`}
                      className="flex items-center gap-1 font-data text-xs text-ink-muted"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          room.pingMs < 50
                            ? 'bg-accent'
                            : room.pingMs < 100
                            ? 'bg-money'
                            : 'bg-danger'
                        }`}
                      />
                      <span>{room.pingMs}ms</span>
                    </div>

                    <Button
                      type="button"
                      variant="compact"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinSelectedRoom(room);
                      }}
                      data-testid={`join-room-button-${room.id}`}
                    >
                      JOIN
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div
          data-testid="create-room-modal"
          className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-panel-light border border-line p-5 rounded-md shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h2 className="font-heading text-lg font-bold text-ink">
                CREATE DUEL ROOM
              </h2>
              <Button
                type="button"
                variant="icon"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close modal"
                className="p-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-data text-xs uppercase text-ink-muted">
                  ROOM NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neon Underpass #7"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  data-testid="new-room-name-input"
                  className="min-h-[44px] px-3 bg-panel border border-line rounded-sm font-data text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-data text-xs uppercase text-ink-muted">
                  WAGER AMOUNT (CR)
                </label>
                <input
                  type="number"
                  min="0"
                  max={playerCredits}
                  step="50"
                  value={newRoomWager}
                  onChange={(e) => setNewRoomWager(Number(e.target.value))}
                  data-testid="new-room-wager-input"
                  className="min-h-[44px] px-3 bg-panel border border-line rounded-sm font-data text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  compact
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  compact
                  data-testid="submit-create-room-button"
                >
                  SPONSOR & HOST
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
