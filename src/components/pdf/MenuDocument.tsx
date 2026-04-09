// Usado solo en el servidor (API route). No importar desde código cliente.

import {
  Document, Page, Text, View,
  StyleSheet, Font,
} from '@react-pdf/renderer'
import React from 'react'
import type { WeeklyPlan, Recipe, ShoppingListItem, MealType } from '@/types'
import { DAYS_ES } from '@/types'


const COLOR = {
  primary:  '#2D6A4F',
  accent:   '#B7E4C7',
  text:     '#1B1B1B',
  muted:    '#6B7280',
  bg:       '#F9FAFB',
  desayuno: '#FEF3C7',
  almuerzo: '#DCFCE7',
  cena:     '#EDE9FE',
}

const s = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', backgroundColor: COLOR.bg, padding: 32, fontSize: 9 },
  cover:        { alignItems: 'center', justifyContent: 'center', height: '100%' },
  coverTitle:   { fontSize: 36, fontWeight: 700, color: COLOR.primary, marginBottom: 8 },
  coverSub:     { fontSize: 14, color: COLOR.muted },
  coverWeek:    { fontSize: 12, color: COLOR.text, marginTop: 16, backgroundColor: COLOR.accent, padding: '6 16', borderRadius: 99 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: COLOR.primary, marginBottom: 10 },
  calRow:       { flexDirection: 'row', marginBottom: 4, gap: 4 },
  calDayLabel:  { width: 64, fontSize: 8, fontWeight: 700, color: COLOR.muted, paddingTop: 4 },
  mealCell:     { flex: 1, borderRadius: 6, padding: '4 6' },
  mealName:     { fontSize: 7, fontWeight: 700, color: COLOR.text, marginBottom: 1 },
  mealKcal:     { fontSize: 6, color: COLOR.muted },
  aisleTitle:   { fontSize: 10, fontWeight: 700, color: COLOR.primary, marginTop: 10, marginBottom: 4 },
  shopRow:      { flexDirection: 'row', justifyContent: 'space-between', borderBottom: `0.5 solid ${COLOR.accent}`, paddingBottom: 3, marginBottom: 3 },
  shopName:     { fontSize: 8, color: COLOR.text },
  shopQty:      { fontSize: 8, color: COLOR.muted },
  footer:       { position: 'absolute', bottom: 20, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:   { fontSize: 7, color: COLOR.muted },
})

const MEAL_BG: Record<MealType, string> = {
  desayuno: COLOR.desayuno,
  almuerzo: COLOR.almuerzo,
  cena:     COLOR.cena,
  snack:    '#FEE2E2',
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>FastMenu · fastmenu.app</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

function Cover({ weekStart }: { weekStart: string }) {
  const d = new Date(weekStart)
  const end = new Date(d); end.setDate(d.getDate() + 6)
  const fmt = (date: Date) => date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
  return (
    <Page size="A4" style={s.page}>
      <View style={s.cover}>
        <Text style={s.coverTitle}>FastMenu</Text>
        <Text style={s.coverSub}>Tu menú semanal inteligente</Text>
        <Text style={s.coverWeek}>{fmt(d)} – {fmt(end)}</Text>
      </View>
    </Page>
  )
}

function CalendarPage({ plan, recipes }: { plan: WeeklyPlan; recipes: Record<string, Recipe> }) {
  const MEALS: MealType[] = ['desayuno', 'almuerzo', 'cena']
  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <Text style={s.sectionTitle}>Calendario Semanal</Text>
      <View style={s.calRow}>
        <View style={{ width: 64 }} />
        {DAYS_ES.map(d => (
          <Text key={d} style={{ flex: 1, fontSize: 8, fontWeight: 700, color: COLOR.primary, textAlign: 'center' }}>{d}</Text>
        ))}
      </View>
      {MEALS.map(meal => (
        <View key={meal} style={s.calRow}>
          <Text style={s.calDayLabel}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
          {Array.from({ length: 7 }, (_, i) => i + 1).map(day => {
            const entry = plan.meals.find(m => m.day_of_week === day && m.meal_type === meal)
            const recipe = entry ? recipes[entry.recipe_id] : null
            return (
              <View key={day} style={[s.mealCell, { backgroundColor: MEAL_BG[meal] }]}>
                {recipe ? (
                  <>
                    <Text style={s.mealName}>{recipe.name}</Text>
                    <Text style={s.mealKcal}>{recipe.calories} kcal · {recipe.prep_time_min}′</Text>
                  </>
                ) : (
                  <Text style={s.mealKcal}>—</Text>
                )}
              </View>
            )
          })}
        </View>
      ))}
      <Footer />
    </Page>
  )
}

function ShoppingListPage({ items }: { items: ShoppingListItem[] }) {
  const byAisle = items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
    if (!acc[item.aisle_category]) acc[item.aisle_category] = []
    acc[item.aisle_category].push(item)
    return acc
  }, {})

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Lista de la Compra Consolidada</Text>
      {Object.entries(byAisle).map(([aisle, aisleItems]) => (
        <View key={aisle} wrap={false}>
          <Text style={s.aisleTitle}>{aisle}</Text>
          {aisleItems.map(item => (
            <View key={item.ingredient_name} style={s.shopRow}>
              <Text style={s.shopName}>{item.ingredient_name}</Text>
              <Text style={s.shopQty}>{item.display_quantity}</Text>
            </View>
          ))}
        </View>
      ))}
      <Footer />
    </Page>
  )
}

export function MenuDocument({
  plan, recipes, shoppingList,
}: {
  plan: WeeklyPlan
  recipes: Record<string, Recipe>
  shoppingList: ShoppingListItem[]
}) {
  return (
    <Document title="FastMenu — Menú Semanal" author="FastMenu" creator="fastmenu.app">
      <Cover weekStart={plan.week_start} />
      <CalendarPage plan={plan} recipes={recipes} />
      <ShoppingListPage items={shoppingList} />
    </Document>
  )
}
