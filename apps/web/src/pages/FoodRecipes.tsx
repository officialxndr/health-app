import { useEffect, useRef, useState } from 'react'
import { useFoodStore } from '@/stores/foodStore'
import { useUiStore } from '@/stores/uiStore'
import { api } from '@/lib/api'
import type { FoodItem, Recipe } from '@/types'
import { Plus, X, ArrowLeft, Trash2, Search, Utensils } from '@/components/icons'

type FormIngredient = { foodItem: FoodItem; quantity: number }

function calcNutrition(ings: FormIngredient[], servings: number) {
  const total = ings.reduce(
    (a, ing) => ({
      calories: a.calories + ing.foodItem.calories * ing.quantity,
      protein: a.protein + ing.foodItem.protein * ing.quantity,
      carbs: a.carbs + ing.foodItem.carbs * ing.quantity,
      fat: a.fat + ing.foodItem.fat * ing.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
  const s = servings > 0 ? servings : 1
  return {
    total,
    perServing: {
      calories: total.calories / s,
      protein: total.protein / s,
      carbs: total.carbs / s,
      fat: total.fat / s,
    },
  }
}

// ── Inline ingredient search ──────────────────────────────────────────────────

function IngredientSearch({ onPick, onClose }: { onPick: (food: FoodItem) => void; onClose: () => void }) {
  const { searchFoods } = useFoodStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [searching, setSearching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (query.length < 2) { setResults([]); return }
    setSearching(true)
    timer.current = setTimeout(async () => {
      const r = await searchFoods(query)
      setResults(r)
      setSearching(false)
    }, 300)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query, searchFoods])

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      <div className="px-4 pt-4 pb-2 border-b border-border safe-top flex items-center gap-3">
        <input
          autoFocus
          className="flex-1 bg-surfaceHigh rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-muted"
          placeholder="Search foods to add…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={onClose} className="text-muted text-sm shrink-0">Cancel</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {searching && <p className="text-center text-muted text-sm py-8">Searching…</p>}
        {!searching && query.length < 2 && (
          <p className="text-center text-muted text-sm py-8 flex items-center justify-center gap-1.5">
            <Search className="w-4 h-4" /> Type to search foods
          </p>
        )}
        {!searching && results.map((item) => (
          <button
            key={item.id}
            onClick={() => onPick(item)}
            className="w-full px-4 py-3 border-b border-border text-left hover:bg-surfaceHigh transition-colors"
          >
            <p className="font-medium text-sm truncate">{item.name}</p>
            <p className="text-xs text-muted truncate">
              {item.brand ? item.brand + ' · ' : ''}{Math.round(item.calories)} kcal / {item.servingSize}{item.servingUnit}
            </p>
          </button>
        ))}
        {!searching && query.length >= 2 && results.length === 0 && (
          <p className="text-center text-muted text-sm py-8">No results for "{query}"</p>
        )}
      </div>
    </div>
  )
}

// ── Recipe form ───────────────────────────────────────────────────────────────

function RecipeForm({ recipe, onClose, onSaved }: { recipe: Recipe | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(recipe?.name ?? '')
  const [servings, setServings] = useState(String(recipe?.servings ?? 1))
  const [ingredients, setIngredients] = useState<FormIngredient[]>(
    recipe?.ingredients.map((i) => ({ foodItem: i.foodItem, quantity: i.quantity })) ?? []
  )
  const [showSearch, setShowSearch] = useState(false)
  const [saving, setSaving] = useState(false)

  const servingsNum = parseFloat(servings) || 1
  const { perServing } = calcNutrition(ingredients, servingsNum)

  const updateQty = (idx: number, qty: string) =>
    setIngredients((list) => list.map((ing, i) => (i === idx ? { ...ing, quantity: parseFloat(qty) || 0 } : ing)))

  const removeIngredient = (idx: number) =>
    setIngredients((list) => list.filter((_, i) => i !== idx))

  const handleSave = async () => {
    if (!name.trim() || ingredients.length === 0) return
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        servings: servingsNum,
        ingredients: ingredients.map((i) => ({ foodItemId: i.foodItem.id, quantity: i.quantity })),
      }
      if (recipe) await api.put(`/recipes/${recipe.id}`, payload)
      else await api.post('/recipes', payload)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 safe-top">
        <button onClick={onClose} className="text-primary flex items-center gap-1 text-sm" aria-label="Back">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h3 className="font-semibold flex-1">{recipe ? 'Edit Recipe' : 'New Recipe'}</h3>
        <button
          onClick={handleSave}
          disabled={!name.trim() || ingredients.length === 0 || saving}
          className="text-primary text-sm font-medium disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs text-muted block mb-1">Name</label>
          <input
            className="w-full bg-surfaceHigh rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken Stir Fry"
          />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1">Servings the recipe yields</label>
          <input
            className="w-24 bg-surfaceHigh rounded-xl px-3 py-2.5 text-sm outline-none"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            inputMode="decimal"
          />
        </div>

        {/* Per-serving nutrition preview */}
        <div className="bg-surfaceHigh rounded-2xl p-4">
          <p className="text-xs text-muted mb-2">Per serving</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><p className="text-lg font-bold">{Math.round(perServing.calories)}</p><p className="text-xs text-muted">kcal</p></div>
            <div><p className="text-lg font-bold text-[#6366f1]">{Math.round(perServing.protein)}g</p><p className="text-xs text-muted">protein</p></div>
            <div><p className="text-lg font-bold text-[#f59e0b]">{Math.round(perServing.carbs)}g</p><p className="text-xs text-muted">carbs</p></div>
            <div><p className="text-lg font-bold text-[#ec4899]">{Math.round(perServing.fat)}g</p><p className="text-xs text-muted">fat</p></div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Ingredients</p>
            <button onClick={() => setShowSearch(true)} className="text-primary text-sm font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {ingredients.length === 0 && (
            <p className="text-muted text-sm py-4 text-center">No ingredients yet. Tap Add to search foods.</p>
          )}

          {ingredients.map((ing, idx) => (
            <div key={`${ing.foodItem.id}:${idx}`} className="bg-surface rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ing.foodItem.name}</p>
                <p className="text-xs text-muted">
                  {Math.round(ing.foodItem.calories * ing.quantity)} kcal · {ing.foodItem.servingSize}{ing.foodItem.servingUnit}/srv
                </p>
              </div>
              <input
                className="w-16 bg-surfaceHigh rounded-lg px-2 py-1.5 text-sm text-center outline-none"
                value={String(ing.quantity)}
                onChange={(e) => updateQty(idx, e.target.value)}
                inputMode="decimal"
                aria-label="Servings of this ingredient"
              />
              <button onClick={() => removeIngredient(idx)} className="text-muted hover:text-danger shrink-0" aria-label="Remove ingredient">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showSearch && (
        <IngredientSearch
          onClose={() => setShowSearch(false)}
          onPick={(food) => {
            setIngredients((list) => [...list, { foodItem: food, quantity: 1 }])
            setShowSearch(false)
          }}
        />
      )}
    </div>
  )
}

// ── Recipes list page ─────────────────────────────────────────────────────────

export function FoodRecipes() {
  const { recipes, fetchRecipes } = useFoodStore()
  const [form, setForm] = useState<{ recipe: Recipe | null } | null>(null)
  const quickAction = useUiStore((s) => s.quickAction)
  const clearQuickAction = useUiStore((s) => s.clearQuickAction)

  useEffect(() => { fetchRecipes().catch(() => {}) }, [fetchRecipes])

  // Open the create form when triggered by the section FAB ("New recipe").
  useEffect(() => {
    if (quickAction === 'food.recipe.new') {
      setForm({ recipe: null })
      clearQuickAction()
    }
  }, [quickAction, clearQuickAction])

  const handleDelete = async (recipe: Recipe) => {
    if (!confirm(`Delete recipe "${recipe.name}"?`)) return
    await api.delete(`/recipes/${recipe.id}`).catch(() => {})
    fetchRecipes().catch(() => {})
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 pb-nav space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recipes</h2>
          <button onClick={() => setForm({ recipe: null })} className="text-primary font-medium text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {recipes.length === 0 ? (
          <div className="text-center text-muted text-sm py-12 space-y-2">
            <Utensils className="w-8 h-8 mx-auto opacity-40" />
            <p>No recipes yet.</p>
            <button onClick={() => setForm({ recipe: null })} className="text-primary font-medium">
              Create your first recipe →
            </button>
          </div>
        ) : (
          recipes.map((r) => (
            <div key={r.id} className="bg-surface rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => setForm({ recipe: r })} className="flex-1 min-w-0 text-left">
                  <h3 className="font-semibold truncate">{r.name}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {r.ingredients.length} ingredient{r.ingredients.length !== 1 ? 's' : ''} · {r.servings} serving{r.servings !== 1 ? 's' : ''}
                  </p>
                </button>
                <button onClick={() => handleDelete(r)} className="text-muted hover:text-danger shrink-0" aria-label="Delete recipe">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center mt-3 pt-3 border-t border-border">
                <div><p className="text-base font-bold">{Math.round(r.nutrition?.perServingCalories ?? 0)}</p><p className="text-[10px] text-muted">kcal/srv</p></div>
                <div><p className="text-base font-bold text-[#6366f1]">{Math.round(r.nutrition?.perServingProtein ?? 0)}g</p><p className="text-[10px] text-muted">protein</p></div>
                <div><p className="text-base font-bold text-[#f59e0b]">{Math.round(r.nutrition?.perServingCarbs ?? 0)}g</p><p className="text-[10px] text-muted">carbs</p></div>
                <div><p className="text-base font-bold text-[#ec4899]">{Math.round(r.nutrition?.perServingFat ?? 0)}g</p><p className="text-[10px] text-muted">fat</p></div>
              </div>
            </div>
          ))
        )}
      </div>

      {form && (
        <RecipeForm
          recipe={form.recipe}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); fetchRecipes().catch(() => {}) }}
        />
      )}
    </div>
  )
}
