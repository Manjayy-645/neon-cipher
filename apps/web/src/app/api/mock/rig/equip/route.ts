import { NextResponse } from 'next/server';
import { mockRigHardware, mockWallet } from '../../db';
import {
  HardwareRailSlot,
  RigHardwareId,
  normalizeHardwareId,
  equipRailModule,
  applyRigPreset,
  RIG_PRESETS,
  RIG_HARDWARE_MODULES,
} from '@neon-cipher/game-rules';

// MOCK: replace with Supabase edge function.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { railSlot, hardwareId, presetId } = body;

    // Collect list of owned module IDs (both standard IDs and normalized keys)
    const ownedIds = new Set<string>();
    for (const [key, qty] of Object.entries(mockWallet.inventory)) {
      if (qty > 0) {
        ownedIds.add(key);
        const norm = normalizeHardwareId(key);
        if (norm) ownedIds.add(norm);
      }
    }
    // Also consider installed hardware owned
    for (const [id, item] of Object.entries(mockRigHardware)) {
      if (item.installed) {
        ownedIds.add(id);
        const norm = normalizeHardwareId(id);
        if (norm) ownedIds.add(norm);
      }
    }

    const currentRails = mockWallet.equippedRails || {
      memory_1: null,
      memory_2: null,
      coprocessor: null,
      bus_interconnect: null,
    };

    // Case 1: Apply Archetype Preset
    // Case 1: Archetype Preset
    if (presetId) {
      const preset = RIG_PRESETS.find((p) => p.id === presetId);
      if (!preset) {
        return NextResponse.json(
          { error: `Unknown preset ID: ${presetId}. Valid presets are safe_learner, cash_farmer, pvp_duelist.` },
          { status: 400 }
        );
      }

      const presetResult = applyRigPreset(presetId as any, Array.from(ownedIds) as RigHardwareId[]);
      mockWallet.equippedRails = { ...presetResult.equipped };

      // Synchronize installed flag on all modules in mockRigHardware
      const equippedModuleIds = Object.values(mockWallet.equippedRails).filter(Boolean);
      for (const [modId, item] of Object.entries(mockRigHardware)) {
        const norm = normalizeHardwareId(modId) || modId;
        item.installed = equippedModuleIds.includes(norm as RigHardwareId);
      }

      return NextResponse.json({
        success: true,
        presetId,
        preset,
        equippedRails: mockWallet.equippedRails,
        missingModules: presetResult.missingModules,
        hardware: mockRigHardware,
        message: `Applied ${preset.name} preset.`,
      });
    }

    // Case 2: Equip or Unequip a single rail slot
    if (!railSlot) {
      return NextResponse.json(
        { error: 'Missing railSlot or presetId parameter.' },
        { status: 400 }
      );
    }

    const validSlots: HardwareRailSlot[] = ['memory_1', 'memory_2', 'coprocessor', 'bus_interconnect'];
    if (!validSlots.includes(railSlot as HardwareRailSlot)) {
      return NextResponse.json(
        { error: `Invalid rail slot: ${railSlot}. Must be one of: ${validSlots.join(', ')}.` },
        { status: 400 }
      );
    }

    const normalizedModId = hardwareId ? normalizeHardwareId(hardwareId) : null;
    if (hardwareId && !normalizedModId) {
      return NextResponse.json(
        { error: `Unknown hardware module: ${hardwareId}.` },
        { status: 400 }
      );
    }

    const slotKey = railSlot as HardwareRailSlot;
    const previousModId = currentRails[slotKey];
    const newEquipped = equipRailModule(currentRails, slotKey, normalizedModId);
    mockWallet.equippedRails = { ...newEquipped };

    // Synchronize installed flags
    const equippedModuleIds = Object.values(mockWallet.equippedRails).filter(Boolean);
    for (const [modId, item] of Object.entries(mockRigHardware)) {
      const norm = normalizeHardwareId(modId) || modId;
      item.installed = equippedModuleIds.includes(norm as RigHardwareId);
    }

    const swappedModuleId = previousModId && previousModId !== normalizedModId ? previousModId : null;
    const moduleName = normalizedModId ? RIG_HARDWARE_MODULES[normalizedModId]?.name || normalizedModId : 'slot';
    const message = normalizedModId
      ? swappedModuleId
        ? `Swapped ${RIG_HARDWARE_MODULES[swappedModuleId]?.name || swappedModuleId} for ${moduleName} on ${railSlot}.`
        : `Equipped ${moduleName} to ${railSlot}.`
      : `Cleared ${railSlot} slot.`;

    return NextResponse.json({
      success: true,
      equippedRails: mockWallet.equippedRails,
      hardware: mockRigHardware,
      swappedModuleId,
      message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Equip hardware failed.' },
      { status: 500 }
    );
  }
}
