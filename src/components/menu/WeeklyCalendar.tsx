'use client'

import { WeeklyMeal, WeeklyPlan, Recipe, DAYS_ES, MealType } from '@/types'
import { MealCard } from './MealCard'

interface WeeklyCalendarProps {
  plan: WeeklyPlan | null
  recipes: Record<string, Recipe>    // keyed by recipe_id
  isLoading: boolean
  onRegenerateMeal?: (dayOfWeek: number, mealType: MealType) => void
}

const MEAL_ORDER: MealType[] = ['desayuno', 'almuerzo', 'cena']

export function WeeklyCalendar({ plan, recipes, isLoading, onRegenerateMeal }: WeeklyCalendarProps) {
  function getMeal(day: number, meal: MealType): WeeklyMeal | undefined {
    return plan?.meals.find(m => m.day_of_week === day && m.meal_type === meal)
  }

  return (
    <section className="weekly-calendar" aria-label="Menú semanal">
      {/* Header row */}
      <div className="weekly-calendar__header">
        <div className="weekly-calendar__header-corner" />
        {DAYS_ES.map(day => (
          <div key={day} className="weekly-calendar__day-label">{day}</div>
        ))}
      </div>

      {/* Meal rows */}
      {MEAL_ORDER.map(mealType => (
        <div key={mealType} className="weekly-calendar__row">
          <div className="weekly-calendar__meal-label">{mealType}</div>
          {Array.from({ length: 7 }, (_, i) => i + 1).map(day => {
            const meal = getMeal(day, mealType)
            const recipe = meal ? recipes[meal.recipe_id] : null
            return (
              <MealCard
                key={`${day}-${mealType}`}
                recipe={recipe ?? null}
                mealType={mealType}
                dayLabel={DAYS_ES[day - 1]}
                isLoading={isLoading}
                onRegenerate={
                  onRegenerateMeal
                    ? () => onRegenerateMeal(day, mealType)
                    : undefined
                }
              />
            )
          })}
        </div>
      ))}
    </section>
  )
}
