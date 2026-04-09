export type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'snack'
export type CuisineType =
  | 'Española' | 'Mediterránea' | 'Italiana' | 'Francesa' | 'Griega'
  | 'Mexicana' | 'Americana' | 'Peruana' | 'Brasileña'
  | 'Japonesa' | 'China' | 'India' | 'Tailandesa'
  | 'Árabe' | 'Marroquí'
  | 'Vegana' | 'Keto' | 'Rápida'

export interface Recipe {
  id: string
  name: string
  description: string
  cuisine_type: CuisineType
  health_score: number
  prep_time_min: number
  meal_type: MealType
  is_vegetarian: boolean
  is_vegan: boolean
  is_gluten_free: boolean
  is_dairy_free: boolean
  is_keto: boolean
  allergens: string[]
  calories: number
  image_url: string
}

export interface ShoppingListItem {
  ingredient_name: string
  aisle_category: string
  total_quantity: number
  unit: string
  display_quantity: string
}

export interface WeeklyMeal {
  day_of_week: number  // 1=Lunes … 7=Domingo
  meal_type: MealType
  recipe_id: string
  recipe_name: string
  score: number
  recipe?: Recipe
}

export interface WeeklyPlan {
  id: string
  user_id: string | null
  session_id: string | null
  week_start: string    // ISO date YYYY-MM-DD
  health_level: number
  excluded_allergens: string[]
  cuisine_preferences: string[]
  meals: WeeklyMeal[]
}

export interface DietaryFilters {
  vegetarian: boolean
  vegan: boolean
  gluten_free: boolean
  dairy_free: boolean
  keto: boolean
}

export interface UserPreferences {
  health_level: number            // 1–10
  excluded_allergens: string[]
  cuisine_preferences: CuisineType[]
  dietary: DietaryFilters
  easy_mode: boolean
}

export const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const MEAL_LABELS: Record<MealType, string> = {
  desayuno: '🌅 Desayuno',
  almuerzo: '☀️ Almuerzo',
  cena:     '🌙 Cena',
  snack:    '🍎 Snack',
}
export const ALLERGENS = ['gluten', 'lacteos', 'huevo', 'frutos_secos', 'pescado', 'marisco', 'soja']
