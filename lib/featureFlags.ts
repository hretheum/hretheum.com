import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Simple feature flags system
// Can be extended to use DB/config for more complex scenarios

export type FeatureFlags = {
  suggestedQueries: boolean
  hybridFollowups: boolean
  chaosMode: boolean
  telemetryDebug: boolean
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  // In production, this could come from DB/cache
  // For now, use environment variables

  return {
    suggestedQueries: process.env.NEXT_PUBLIC_RULES_CSR_SUGGESTED_QUERIES === 'true',
    hybridFollowups: process.env.NEXT_PUBLIC_RULES_AI_FOLLOWUPS === 'true',
    chaosMode: process.env.NEXT_PUBLIC_CHAOS_MODE === 'true',
    telemetryDebug: process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === 'true'
  }
}

export async function getFeatureFlag(flag: keyof FeatureFlags): Promise<boolean> {
  const flags = await getFeatureFlags()
  return flags[flag]
}