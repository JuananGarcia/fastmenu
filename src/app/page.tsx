'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { UserPreferences, WeeklyPlan, Recipe, ShoppingListItem, MealType } from '@/types'
import {
  getOrCreateWeeklyPlan,
  generateWeeklyMenu,
  getShoppingList,
  loadPreferences,
  savePreferences,
  loadLatestWeeklyPlan,
  supabase,
} from '@/lib/supabase'
import { PreferencesForm } from '@/components/preferences/PreferencesForm'
import { WeeklyCalendar } from '@/components/menu/WeeklyCalendar'
import { ExportPDFButton } from '@/components/pdf/MenuPDF'
import { RandomDishPicker } from '@/components/random/RandomDishPicker'

type Tab = 'menu' | 'random'

const DEFAULT_PREFS: UserPreferences = {
  health_level:        5,
  excluded_allergens:  [],
  cuisine_preferences: [],
  dietary: {
    vegetarian: false,
    vegan:      false,
    gluten_free: false,
    dairy_free:  false,
    keto:        false,
  },
  easy_mode: false,
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('menu')
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({})
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS)
  const [shareCopied, setShareCopied] = useState(false)
  const shareCopiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [welcomeBanner, setWelcomeBanner] = useState<'new' | 'returning' | null>(null)

  // On sign-in: load preferences + latest saved menu
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          const [saved, latestPlan] = await Promise.all([
            loadPreferences(),
            loadLatestWeeklyPlan(),
          ])

          if (saved) setPrefs(saved)

          if (latestPlan) {
            try {
              const planId = latestPlan.id as string
              const [recipeMap, shopping] = await Promise.all([
                loadRecipes(planId),
                getShoppingList(planId),
              ])
              setPlan(mapPlanData(latestPlan))
              setRecipes(recipeMap)
              setShoppingList(shopping ?? [])
              setWelcomeBanner('returning')
            } catch {
              // Plan load failed silently — user can still generate a new one
            }
          } else {
            setWelcomeBanner('new')
          }

          setTimeout(() => setWelcomeBanner(null), 5000)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function loadRecipes(planId: string): Promise<Record<string, Recipe>> {
    const { data, error } = await supabase
      .from('weekly_plan_meals')
      .select('recipe_id, recipes(*)')
      .eq('plan_id', planId)

    if (error) throw error

    const map: Record<string, Recipe> = {}
    for (const row of data ?? []) {
      if (row.recipes) map[row.recipe_id] = row.recipes as unknown as Recipe
    }
    return map
  }

  function mapPlanData(raw: Record<string, unknown>): WeeklyPlan {
    const meals = (raw.weekly_plan_meals as Array<{
      recipe_id: string; day_of_week: number; meal_type: string
    }> ?? []).map(m => ({
      day_of_week: m.day_of_week,
      meal_type:   m.meal_type as MealType,
      recipe_id:   m.recipe_id,
      recipe_name: '',
      score:       0,
    }))
    return { ...raw, meals } as unknown as WeeklyPlan
  }

  const handleGenerateMenu = useCallback(async (newPrefs: UserPreferences, forceRegenerate = false) => {
    setIsLoading(true)
    setError(null)
    setPrefs(newPrefs)

    try {
      const weeklyPlan = await getOrCreateWeeklyPlan(
        newPrefs.health_level,
        newPrefs.excluded_allergens,
        newPrefs.cuisine_preferences,
      )

      if (forceRegenerate) {
        await supabase.from('weekly_plan_meals').delete().eq('plan_id', weeklyPlan.id)
      }

      await generateWeeklyMenu(
        weeklyPlan.id,
        newPrefs.health_level,
        newPrefs.excluded_allergens,
        newPrefs.cuisine_preferences,
        newPrefs.easy_mode,
      )

      const { data: fullPlan, error: planErr } = await supabase
        .from('weekly_plans')
        .select('*, weekly_plan_meals(*)')
        .eq('id', weeklyPlan.id)
        .single()

      if (planErr) throw planErr

      const recipeMap = await loadRecipes(weeklyPlan.id)
      const shopping  = await getShoppingList(weeklyPlan.id)

      setPlan(mapPlanData(fullPlan as Record<string, unknown>))
      setRecipes(recipeMap)
      setShoppingList(shopping ?? [])

      // Persist preferences for authenticated users
      await savePreferences(newPrefs)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar el menú'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  async function handleRegenerateMeal(dayOfWeek: number, mealType: MealType) {
    if (!plan) return
    try {
      await supabase.rpc('regenerate_meal', {
        p_plan_id:    plan.id,
        p_day:        dayOfWeek,
        p_meal_type:  mealType,
        p_health_level: prefs.health_level,
        p_excluded_allergens: prefs.excluded_allergens,
      })

      const { data: fullPlan, error: planErr } = await supabase
        .from('weekly_plans')
        .select('*, weekly_plan_meals(*)')
        .eq('id', plan.id)
        .single()

      if (planErr) throw planErr

      const [recipeMap, shopping] = await Promise.all([
        loadRecipes(plan.id),
        getShoppingList(plan.id),
      ])
      setPlan(mapPlanData(fullPlan as Record<string, unknown>))
      setRecipes(recipeMap)
      setShoppingList(shopping ?? [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al regenerar el plato'
      setError(message)
    }
  }

  const shoppingByAisle = shoppingList.reduce<Record<string, ShoppingListItem[]>>(
    (acc, item) => {
      if (!acc[item.aisle_category]) acc[item.aisle_category] = []
      acc[item.aisle_category].push(item)
      return acc
    },
    {},
  )

  function buildShoppingText(): string {
    const weekLabel = plan
      ? new Date(plan.week_start).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
      : ''
    const header = `🛒 Lista de la compra${weekLabel ? ` – semana del ${weekLabel}` : ''}`
    const body = Object.entries(shoppingByAisle)
      .map(([aisle, items]) => {
        const lines = items.map(i => `• ${i.ingredient_name} — ${i.display_quantity}`).join('\n')
        return `\n${aisle.toUpperCase()}\n${lines}`
      })
      .join('\n')
    return `${header}\n${body}`
  }

  async function handleShareList() {
    const text = buildShoppingText()
    if (navigator.share) {
      try {
        await navigator.share({ title: '🛒 Lista de la compra – FastMenu', text })
        return
      } catch {
        // User cancelled share — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(text)
    if (shareCopiedTimer.current) clearTimeout(shareCopiedTimer.current)
    setShareCopied(true)
    shareCopiedTimer.current = setTimeout(() => setShareCopied(false), 2500)
  }

  return (
    <>
      {welcomeBanner === 'returning' && (
        <div className="banner banner--success" role="status">
          ¡Bienvenido de vuelta! Tus menús y preferencias han sido cargados.
        </div>
      )}
      {welcomeBanner === 'new' && (
        <div className="banner banner--info" role="status">
          ¡Suscripción completada! Genera tu primer menú y quedará guardado para siempre.
        </div>
      )}

      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab-bar__tab ${activeTab === 'menu' ? 'tab-bar__tab--active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          📅 Menú semanal
        </button>
        <button
          className={`tab-bar__tab ${activeTab === 'random' ? 'tab-bar__tab--active' : ''}`}
          onClick={() => setActiveTab('random')}
        >
          🎲 ¿Qué me hago?
        </button>
      </div>

      {/* ── Tab: Menú semanal ── */}
      {activeTab === 'menu' && (
        <>
          <PreferencesForm
            initial={prefs}
            isLoading={isLoading}
            onSubmit={handleGenerateMenu}
          />

          {error && (
            <div className="banner banner--error" role="alert">
              ⚠️ {error}
            </div>
          )}

          {(plan || isLoading) && (
            <>
              <div className="page-actions">
                <h2 className="page-actions__title">
                  📅 Menú semanal
                  {plan?.week_start && (
                    <span style={{ fontWeight: 400, fontSize: '.875rem', marginLeft: 8, color: 'var(--color-muted)' }}>
                      semana del {new Date(plan.week_start).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </span>
                  )}
                </h2>
                <div className="page-actions__right">
                  <ExportPDFButton
                    plan={plan}
                    recipes={recipes}
                    shoppingList={shoppingList}
                    disabled={isLoading}
                  />
                  <button
                    className="btn btn--outline"
                    onClick={() => handleGenerateMenu(prefs, true)}
                    disabled={isLoading}
                  >
                    🔄 Regenerar todo
                  </button>
                </div>
              </div>

              <WeeklyCalendar
                plan={plan}
                recipes={recipes}
                isLoading={isLoading}
                onRegenerateMeal={handleRegenerateMeal}
              />

              {shoppingList.length > 0 && (
                <section className="shopping-section" aria-label="Lista de la compra">
                  <div className="shopping-section__header">
                    <h3 className="shopping-section__title">🛒 Lista de la compra</h3>
                    <button
                      className="btn btn--outline btn--sm shopping-share-btn"
                      onClick={handleShareList}
                      title="Compartir / copiar lista"
                    >
                      {shareCopied ? '✅ Copiado' : '📤 Compartir lista'}
                    </button>
                  </div>
                  <div className="shopping-aisles">
                    {Object.entries(shoppingByAisle).map(([aisle, items]) => (
                      <div key={aisle}>
                        <p className="shopping-aisle__name">{aisle}</p>
                        {items.map((item, index) => (
                          <div key={`${item.ingredient_name}-${index}`} className="shopping-item">
                            <span className="shopping-item__name">{item.ingredient_name}</span>
                            <span className="shopping-item__qty">{item.display_quantity}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {!plan && !isLoading && (
            <div className="banner banner--info" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
              👆 Ajusta tus preferencias y pulsa <strong>Generar menú</strong> para empezar.
            </div>
          )}
        </>
      )}

      {/* ── Tab: ¿Qué me hago? ── */}
      {activeTab === 'random' && (
        <div className="random-tab">
          <div className="random-tab__header">
            <h2 className="random-tab__title">🎲 ¿Qué me hago?</h2>
            <p className="random-tab__subtitle">
              Sin inspiración? Dinos qué momento del día es y te sugerimos una receta al instante.
            </p>
          </div>
          <RandomDishPicker />
        </div>
      )}
    </>
  )
}
