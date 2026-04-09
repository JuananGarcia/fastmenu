'use client'

import { useState } from 'react'
import type { UserPreferences, CuisineType, DietaryFilters } from '@/types'
import { ALLERGENS } from '@/types'

const CUISINE_GROUPS: { label: string; items: CuisineType[] }[] = [
  {
    label: 'Europa',
    items: ['Española', 'Mediterránea', 'Italiana', 'Francesa', 'Griega'],
  },
  {
    label: 'América',
    items: ['Mexicana', 'Americana', 'Peruana', 'Brasileña'],
  },
  {
    label: 'Asia',
    items: ['Japonesa', 'China', 'India', 'Tailandesa'],
  },
  {
    label: 'Oriente Medio & África',
    items: ['Árabe', 'Marroquí'],
  },
  {
    label: 'Especiales',
    items: ['Vegana', 'Keto', 'Rápida'],
  },
]

const ALLERGEN_LABELS: Record<string, string> = {
  gluten:       '🌾 Gluten',
  lacteos:      '🥛 Lácteos',
  huevo:        '🥚 Huevo',
  frutos_secos: '🥜 Frutos secos',
  pescado:      '🐟 Pescado',
  marisco:      '🦐 Marisco',
  soja:         '🫘 Soja',
}

const DIETARY_LABELS: { key: keyof DietaryFilters; label: string }[] = [
  { key: 'vegetarian',  label: '🥦 Vegetariano' },
  { key: 'vegan',       label: '🌱 Vegano' },
  { key: 'gluten_free', label: '🚫🌾 Sin gluten' },
  { key: 'dairy_free',  label: '🚫🥛 Sin lácteos' },
  { key: 'keto',        label: '🥑 Keto' },
]

interface PreferencesFormProps {
  initial: UserPreferences
  isLoading: boolean
  onSubmit: (prefs: UserPreferences) => void
}

export function PreferencesForm({ initial, isLoading, onSubmit }: PreferencesFormProps) {
  const [healthLevel, setHealthLevel] = useState(initial.health_level)
  const [allergens, setAllergens] = useState<string[]>(initial.excluded_allergens)
  const [cuisines, setCuisines] = useState<CuisineType[]>(initial.cuisine_preferences)
  const [dietary, setDietary] = useState<DietaryFilters>(initial.dietary)
  const [easyMode, setEasyMode] = useState(initial.easy_mode)

  function toggleAllergen(a: string) {
    setAllergens(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    )
  }

  function toggleCuisine(c: CuisineType) {
    setCuisines(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  function toggleDietary(key: keyof DietaryFilters) {
    setDietary(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ health_level: healthLevel, excluded_allergens: allergens, cuisine_preferences: cuisines, dietary, easy_mode: easyMode })
  }

  return (
    <form className="prefs-card" onSubmit={handleSubmit} aria-label="Preferencias del menú">
      <h2 className="prefs-card__title">⚙️ Personaliza tu menú</h2>

      <div className="prefs-sections">

        {/* Easy mode toggle */}
        <div className="prefs-field prefs-field--full">
          <button
            type="button"
            role="switch"
            aria-checked={easyMode}
            className={`easy-mode-toggle ${easyMode ? 'easy-mode-toggle--active' : ''}`}
            onClick={() => setEasyMode(prev => !prev)}
          >
            <span className="easy-mode-toggle__icon">🥱</span>
            <span className="easy-mode-toggle__text">
              <strong>Menú Fácil</strong>
              <small>Solo platos con ≤20 min de preparación e ingredientes sencillos</small>
            </span>
            <span className="easy-mode-toggle__badge">
              {easyMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Health level */}
        <div className="prefs-field prefs-field--full">
          <label htmlFor="health-slider">Nivel de salud</label>
          <small>1 = Comfort food · 10 = Dieta estricta</small>
          <div className="health-slider">
            <input
              id="health-slider"
              type="range"
              min={1}
              max={10}
              value={healthLevel}
              onChange={e => setHealthLevel(Number(e.target.value))}
            />
            <span className="health-slider__value">{healthLevel}</span>
          </div>
        </div>

        {/* Dietary filters */}
        <div className="prefs-field prefs-field--full">
          <label>Dieta</label>
          <div className="chip-group" role="group" aria-label="Filtros dietéticos">
            {DIETARY_LABELS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="checkbox"
                aria-checked={dietary[key]}
                className={`chip ${dietary[key] ? 'chip--active' : ''}`}
                onClick={() => toggleDietary(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Allergens */}
        <div className="prefs-field prefs-field--full">
          <label>Excluir alérgenos</label>
          <div className="chip-group" role="group" aria-label="Alérgenos a excluir">
            {ALLERGENS.map(a => (
              <button
                key={a}
                type="button"
                role="checkbox"
                aria-checked={allergens.includes(a)}
                className={`chip ${allergens.includes(a) ? 'chip--active chip--allergen' : ''}`}
                onClick={() => toggleAllergen(a)}
              >
                {ALLERGEN_LABELS[a]}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisines grouped */}
        <div className="prefs-field prefs-field--full">
          <label>Preferencia de cocina</label>
          <small>Vacío = sin preferencia (mezcla todo)</small>
          <div className="cuisine-groups">
            {CUISINE_GROUPS.map(group => (
              <div key={group.label} className="cuisine-group">
                <p className="cuisine-group__label">{group.label}</p>
                <div className="chip-group">
                  {group.items.map(c => (
                    <button
                      key={c}
                      type="button"
                      role="checkbox"
                      aria-checked={cuisines.includes(c)}
                      className={`chip ${cuisines.includes(c) ? 'chip--active' : ''}`}
                      onClick={() => toggleCuisine(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="prefs-actions">
        {cuisines.length > 0 && (
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setCuisines([])}
          >
            Limpiar selección
          </button>
        )}
        <button
          type="submit"
          className="btn btn--primary"
          disabled={isLoading}
        >
          {isLoading ? '⏳ Generando…' : '✨ Generar menú'}
        </button>
      </div>
    </form>
  )
}
