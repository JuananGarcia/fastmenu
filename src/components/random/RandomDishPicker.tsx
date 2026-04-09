'use client'

import { useState } from 'react'
import type { MealType, Recipe, DietaryFilters } from '@/types'
import { getRandomRecipe } from '@/lib/supabase'

const MEAL_OPTIONS: { type: MealType; emoji: string; label: string; desc: string }[] = [
  { type: 'desayuno', emoji: '🌅', label: 'Desayuno',  desc: 'Para empezar el día' },
  { type: 'almuerzo', emoji: '☀️', label: 'Almuerzo',  desc: 'El plato del mediodía' },
  { type: 'cena',     emoji: '🌙', label: 'Cena',      desc: 'Para terminar el día' },
  { type: 'snack',    emoji: '🍎', label: 'Snack',     desc: 'Un capricho rápido' },
]

const ALLERGEN_LABELS: Record<string, string> = {
  gluten:       'Gluten',
  lacteos:      'Lácteos',
  huevo:        'Huevo',
  frutos_secos: 'Frutos secos',
  pescado:      'Pescado',
  marisco:      'Marisco',
  soja:         'Soja',
}

const DIETARY_FLAGS: { key: keyof DietaryFilters; label: string; color: string }[] = [
  { key: 'vegetarian',  label: '🥦 Vegetariano', color: '#16a34a' },
  { key: 'vegan',       label: '🌱 Vegano',       color: '#15803d' },
  { key: 'gluten_free', label: '🚫🌾 Sin gluten', color: '#b45309' },
  { key: 'dairy_free',  label: '🚫🥛 Sin lácteos', color: '#0369a1' },
  { key: 'keto',        label: '🥑 Keto',         color: '#7c3aed' },
]

const ALLERGENS = ['gluten', 'lacteos', 'huevo', 'frutos_secos', 'pescado', 'marisco', 'soja']

const DEFAULT_DIETARY: DietaryFilters = {
  vegetarian: false, vegan: false, gluten_free: false, dairy_free: false, keto: false,
}

function RecipeBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="recipe-badge" style={{ background: color + '18', color, borderColor: color + '40' }}>
      {label}
    </span>
  )
}

export function RandomDishPicker() {
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [allergens, setAllergens] = useState<string[]>([])
  const [dietary, setDietary] = useState<DietaryFilters>(DEFAULT_DIETARY)

  function toggleAllergen(a: string) {
    setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  function toggleDietary(key: keyof DietaryFilters) {
    setDietary(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function pickRandom(mealType: MealType) {
    setSelectedMeal(mealType)
    setIsLoading(true)
    setNotFound(false)
    setRecipe(null)

    const result = await getRandomRecipe(mealType, allergens, dietary)
    setIsLoading(false)

    if (!result) {
      setNotFound(true)
    } else {
      setRecipe(result)
    }
  }

  async function pickAnother() {
    if (!selectedMeal) return
    await pickRandom(selectedMeal)
  }

  async function surprise() {
    const all: MealType[] = ['desayuno', 'almuerzo', 'cena', 'snack']
    const random = all[Math.floor(Math.random() * all.length)]
    await pickRandom(random)
  }

  const recipeDietaryFlags = recipe
    ? DIETARY_FLAGS.filter(f => {
        if (f.key === 'vegetarian') return recipe.is_vegetarian
        if (f.key === 'vegan')      return recipe.is_vegan
        if (f.key === 'gluten_free') return recipe.is_gluten_free
        if (f.key === 'dairy_free')  return recipe.is_dairy_free
        if (f.key === 'keto')        return recipe.is_keto
        return false
      })
    : []

  return (
    <div className="random-picker">

      {/* Filters row */}
      <div className="random-picker__filters">
        <div className="random-picker__filter-group">
          <p className="random-picker__filter-label">Dieta</p>
          <div className="chip-group">
            {DIETARY_FLAGS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`chip chip--sm ${dietary[key] ? 'chip--active' : ''}`}
                onClick={() => toggleDietary(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="random-picker__filter-group">
          <p className="random-picker__filter-label">Excluir alérgenos</p>
          <div className="chip-group">
            {ALLERGENS.map(a => (
              <button
                key={a}
                type="button"
                className={`chip chip--sm ${allergens.includes(a) ? 'chip--active chip--allergen' : ''}`}
                onClick={() => toggleAllergen(a)}
              >
                {ALLERGEN_LABELS[a]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meal type selector */}
      <div className="random-picker__meals">
        {MEAL_OPTIONS.map(opt => (
          <button
            key={opt.type}
            className={`meal-btn meal-btn--${opt.type} ${selectedMeal === opt.type ? 'meal-btn--active' : ''}`}
            onClick={() => pickRandom(opt.type)}
            disabled={isLoading}
          >
            <span className="meal-btn__emoji">{opt.emoji}</span>
            <span className="meal-btn__label">{opt.label}</span>
            <span className="meal-btn__desc">{opt.desc}</span>
          </button>
        ))}
      </div>

      {/* Surprise button */}
      <div className="random-picker__surprise">
        <button className="btn btn--outline" onClick={surprise} disabled={isLoading}>
          🎲 Sorpréndeme con cualquier cosa
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="random-result random-result--loading">
          <div className="random-result__skeleton">
            <div className="skeleton-img" style={{ height: 200, borderRadius: 12 }} />
            <div className="skeleton-text" style={{ marginTop: 16, height: 18 }} />
            <div className="skeleton-text skeleton-text--short" style={{ height: 12 }} />
          </div>
        </div>
      )}

      {/* Not found */}
      {notFound && !isLoading && (
        <div className="banner banner--info" style={{ textAlign: 'center', marginTop: 24 }}>
          😔 No encontramos recetas con esos filtros. Prueba con menos restricciones.
        </div>
      )}

      {/* Recipe result */}
      {recipe && !isLoading && (
        <div className="random-result">
          <div className={`random-card random-card--${recipe.meal_type}`}>
            <div className="random-card__header">
              <div className="random-card__cuisine">{recipe.cuisine_type}</div>
              <div className="random-card__meal-type">
                {MEAL_OPTIONS.find(m => m.type === recipe.meal_type)?.emoji}{' '}
                {MEAL_OPTIONS.find(m => m.type === recipe.meal_type)?.label}
              </div>
            </div>

            <h3 className="random-card__title">{recipe.name}</h3>
            <p className="random-card__desc">{recipe.description}</p>

            <div className="random-card__meta">
              {recipe.prep_time_min > 0 && (
                <span>⏱ {recipe.prep_time_min} min</span>
              )}
              {recipe.calories && (
                <span>🔥 {recipe.calories} kcal</span>
              )}
              {recipe.health_score && (
                <span>💚 Salud {recipe.health_score}/10</span>
              )}
            </div>

            {recipeDietaryFlags.length > 0 && (
              <div className="random-card__badges">
                {recipeDietaryFlags.map(f => (
                  <RecipeBadge key={f.key} label={f.label} color={f.color} />
                ))}
              </div>
            )}
          </div>

          <div className="random-picker__actions">
            <button className="btn btn--primary" onClick={pickAnother} disabled={isLoading}>
              🔄 Dame otra opción
            </button>
            <button className="btn btn--outline" onClick={surprise} disabled={isLoading}>
              🎲 Sorpréndeme
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedMeal && !isLoading && (
        <div className="random-picker__empty">
          <p className="random-picker__empty-icon">🍽️</p>
          <p className="random-picker__empty-text">
            ¿No sabes qué hacerte? Pulsa en el tipo de comida que necesitas<br />
            y te sugerimos una receta al instante.
          </p>
        </div>
      )}
    </div>
  )
}
