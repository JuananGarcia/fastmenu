import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import { MenuDocument } from '@/components/pdf/MenuDocument'
import type { WeeklyPlan, Recipe, ShoppingListItem } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { plan, recipes, shoppingList } = await req.json() as {
      plan: WeeklyPlan
      recipes: Record<string, Recipe>
      shoppingList: ShoppingListItem[]
    }

    // MenuDocument devuelve <Document>, pero TS no puede inferirlo a través
    // de createElement — renderToBuffer exige ReactElement<DocumentProps>.
    const buffer = await renderToBuffer(
      React.createElement(MenuDocument, { plan, recipes, shoppingList }) as React.ReactElement<DocumentProps>
    )

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="FastMenu.pdf"',
      },
    })
  } catch (err) {
    console.error('[export-pdf]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
