'use client'

import type { WeeklyPlan, Recipe, ShoppingListItem } from '@/types'

export async function exportMenuPDF(
  plan: WeeklyPlan,
  recipes: Record<string, Recipe>,
  shoppingList: ShoppingListItem[],
) {
  const res = await fetch('/api/export-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, recipes, shoppingList }),
  })

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(`Error generando el PDF: ${error}`)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url

  const weekLabel = new Date(plan.week_start)
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    .replace(' ', '-')
  a.download = `FastMenu_${weekLabel}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

interface ExportButtonProps {
  plan: WeeklyPlan | null
  recipes: Record<string, Recipe>
  shoppingList: ShoppingListItem[]
  disabled?: boolean
}

export function ExportPDFButton({ plan, recipes, shoppingList, disabled }: ExportButtonProps) {
  async function handleClick() {
    if (!plan) return
    await exportMenuPDF(plan, recipes, shoppingList)
  }

  return (
    <button
      onClick={handleClick}
      disabled={!plan || disabled}
      className="export-btn"
      aria-label="Exportar menú a PDF"
    >
      📄 Exportar PDF
    </button>
  )
}
