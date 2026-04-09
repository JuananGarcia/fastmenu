'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Recipe, MealType, MEAL_LABELS } from '@/types'

interface MealCardProps {
  recipe: Recipe | null
  mealType: MealType
  dayLabel: string
  isLoading?: boolean
  onRegenerate?: () => void
}

export function MealCard({ recipe, mealType, dayLabel, isLoading, onRegenerate }: MealCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function handleRegenerate() {
    if (!onRegenerate) return
    setIsRefreshing(true)
    await onRegenerate()
    // Elastic bounce animation: 400ms settle
    setTimeout(() => setIsRefreshing(false), 400)
  }

  if (isLoading || isRefreshing) {
    return (
      <div className="meal-card meal-card--skeleton" aria-busy="true">
        <div className="skeleton-img" />
        <div className="skeleton-text skeleton-text--short" />
        <div className="skeleton-text" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="meal-card meal-card--empty">
        <span className="meal-card__empty-icon">🍽️</span>
        <p className="meal-card__empty-text">Sin receta</p>
      </div>
    )
  }

  return (
    <article
      className={`meal-card meal-card--${mealType} ${isRefreshing ? 'meal-card--bouncing' : ''}`}
      aria-label={`${dayLabel} ${MEAL_LABELS[mealType]}: ${recipe.name}`}
    >
      {/* Image */}
      <div className="meal-card__image-wrapper">
        {recipe.image_url && recipe.image_url.startsWith('http') ? (
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="meal-card__image"
          />
        ) : (
          <div className="meal-card__image-placeholder" aria-hidden="true">🍽️</div>
        )}
        <span className="meal-card__cuisine-badge">{recipe.cuisine_type}</span>
      </div>

      {/* Body */}
      <div className="meal-card__body">
        <p className="meal-card__meal-type">{MEAL_LABELS[mealType]}</p>
        <h3 className="meal-card__title">{recipe.name}</h3>
        <div className="meal-card__meta">
          <span className="meal-card__health" title="Nivel de salud">
            {'🟢'.repeat(Math.round(recipe.health_score / 2))}
          </span>
          <span className="meal-card__time">⏱ {recipe.prep_time_min} min</span>
          <span className="meal-card__calories">🔥 {recipe.calories} kcal</span>
        </div>
      </div>

      {/* Regenerate button — elastic micro-animation via CSS */}
      {onRegenerate && (
        <button
          className="meal-card__regen-btn"
          onClick={handleRegenerate}
          aria-label={`Cambiar ${recipe.name}`}
          title="Cambiar este plato"
        >
          ↺
        </button>
      )}
    </article>
  )
}
