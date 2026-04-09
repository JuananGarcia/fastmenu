import { createBrowserClient } from '@supabase/ssr'
import { v4 as uuidv4 } from 'uuid'
import type { MealType, DietaryFilters, Recipe } from '@/types'

// ─── Anonymous session management ───────────────────────────────────────────
const SESSION_KEY = 'fm_session_id'

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = uuidv4()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

// Lazy singleton — initialized on first use so getSessionId() runs in the browser
// and the x-session-id header is included for anonymous RLS policies
let _client: ReturnType<typeof createBrowserClient> | null = null

function getClient() {
  if (!_client) {
    const sessionId = getSessionId()
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      sessionId ? { global: { headers: { 'x-session-id': sessionId } } } : {},
    )
  }
  return _client
}

export const supabase = new Proxy(
  {} as ReturnType<typeof createBrowserClient>,
  { get: (_, prop) => getClient()[prop as keyof ReturnType<typeof createBrowserClient>] },
)

// ─── Generate menu via RPC ───────────────────────────────────────────────────
export async function generateWeeklyMenu(
  planId: string,
  healthLevel: number,
  excludedAllergens: string[],
  cuisinePreferences: string[],
  easyMode = false,
) {
  const { data, error } = await supabase.rpc('generate_weekly_menu', {
    p_health_level:        healthLevel,
    p_excluded_allergens:  excludedAllergens,
    p_cuisine_preferences: cuisinePreferences,
    p_plan_id:             planId,
    p_easy_mode:           easyMode,
  })
  if (error) throw error
  return data
}

// ─── Create or fetch this week's plan ────────────────────────────────────────
export async function getOrCreateWeeklyPlan(
  healthLevel: number,
  excludedAllergens: string[],
  cuisinePreferences: string[],
) {
  const sessionId = getSessionId()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  const weekStart = getMondayISO()

  // Try to find an existing plan for this week
  let query = supabase
    .from('weekly_plans')
    .select('*')
    .eq('week_start', weekStart)

  if (user) {
    query = query.eq('user_id', user.id)
  } else {
    query = query.eq('session_id', sessionId)
  }

  const { data: existing, error: selectErr } = await query.maybeSingle()
  // selectErr here means multiple rows — unique constraint now prevents this,
  // but handle gracefully just in case
  if (existing && !selectErr) return existing

  // Create a new plan
  const { data: plan, error } = await supabase
    .from('weekly_plans')
    .insert({
      user_id:             user?.id ?? null,
      session_id:          user ? null : sessionId,
      week_start:          weekStart,
      health_level:        healthLevel,
      excluded_allergens:  excludedAllergens,
      cuisine_preferences: cuisinePreferences,
    })
    .select()
    .single()

  if (error) throw error
  return plan
}

// ─── Shopping list ────────────────────────────────────────────────────────────
export async function getShoppingList(planId: string) {
  const { data, error } = await supabase
    .from('shopping_list')
    .select('*')
    .eq('plan_id', planId)

  if (error) throw error
  return data
}

// ─── Claim anon plans after sign-in ──────────────────────────────────────────
export async function claimAnonymousPlans() {
  const sessionId = getSessionId()
  if (!sessionId) return
  await supabase.rpc('claim_anonymous_plans', { p_session_id: sessionId })
  localStorage.removeItem(SESSION_KEY)
}

// ─── Random recipe ───────────────────────────────────────────────────────────
export async function getRandomRecipe(
  mealType: MealType,
  excludedAllergens: string[],
  dietary: DietaryFilters,
): Promise<Recipe | null> {
  let query = supabase
    .from('recipes')
    .select('*')
    .eq('meal_type', mealType)

  if (dietary.vegetarian) query = query.eq('is_vegetarian', true)
  if (dietary.vegan)      query = query.eq('is_vegan', true)
  if (dietary.gluten_free) query = query.eq('is_gluten_free', true)
  if (dietary.dairy_free)  query = query.eq('is_dairy_free', true)
  if (dietary.keto)        query = query.eq('is_keto', true)

  for (const allergen of excludedAllergens) {
    query = query.not('allergens', 'cs', `{"${allergen}"}`)
  }

  const { data, error } = await query
  if (error || !data || data.length === 0) return null

  return data[Math.floor(Math.random() * data.length)] as Recipe
}

// ─── Load latest weekly plan for authenticated user ───────────────────────────
export async function loadLatestWeeklyPlan() {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) return null

  const { data, error } = await supabase
    .from('weekly_plans')
    .select('*, weekly_plan_meals(*)')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as Record<string, unknown>
}

// ─── User preferences ────────────────────────────────────────────────────────
import type { UserPreferences } from '@/types'

export async function savePreferences(prefs: UserPreferences) {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) return

  await supabase
    .from('user_preferences')
    .upsert({
      user_id:             user.id,
      health_level:        prefs.health_level,
      excluded_allergens:  prefs.excluded_allergens,
      cuisine_preferences: prefs.cuisine_preferences,
      dietary:             prefs.dietary,
    }, { onConflict: 'user_id' })
}

export async function loadPreferences(): Promise<UserPreferences | null> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) return null

  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return null

  return {
    health_level:        data.health_level,
    excluded_allergens:  data.excluded_allergens ?? [],
    cuisine_preferences: data.cuisine_preferences ?? [],
    dietary:             data.dietary ?? {
      vegetarian: false, vegan: false, gluten_free: false, dairy_free: false, keto: false,
    },
    easy_mode: data.easy_mode ?? false,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getMondayISO(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}
