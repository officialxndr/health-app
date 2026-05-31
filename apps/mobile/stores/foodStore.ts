import { create } from 'zustand';
import { format } from 'date-fns';
import { foodRepo } from '../lib/repositories/FoodRepo';
import { api } from '../lib/api';
import { useServerStore } from './serverStore';
import type { FoodItem, FoodLog, Recipe } from '../types';

interface FoodState {
  logs: FoodLog[];
  recipes: Recipe[];
  date: Date;
  loading: boolean;

  setDate: (date: Date) => void;
  fetchLogs: (date?: Date) => void;
  addLog: (payload: {
    meal: string;
    foodItemLocalId?: string;
    recipeLocalId?: string;
    servingQty: number;
  }) => void;
  updateLog: (localId: string, servingQty: number) => void;
  deleteLog: (localId: string) => void;

  searchFoods: (q: string) => Promise<FoodItem[]>;
  scanBarcode: (barcode: string) => Promise<FoodItem | null>;
  createCustomFood: (item: Omit<FoodItem, 'id' | 'createdAt'>) => string;

  fetchRecipes: () => void;
  getDailyCalories: (from: string, to: string) => { date: string; calories: number }[];
  getDayTotals: (date: string) => { calories: number; protein: number; carbs: number; fat: number };
}

export const useFoodStore = create<FoodState>((set, get) => ({
  logs: [],
  recipes: [],
  date: new Date(),
  loading: false,

  setDate: (date) => {
    set({ date });
    get().fetchLogs(date);
  },

  fetchLogs: (date) => {
    const d = date ?? get().date;
    const dateStr = format(d, 'yyyy-MM-dd');
    try {
      const logs = foodRepo.getLogs(dateStr);
      set({ logs });
    } catch (e) {
      console.warn('fetchLogs error', e);
    }
    // Background server sync (fire and forget)
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.get('/food/log', { params: { date: dateStr } })
        .then(({ data }) => {
          if (Array.isArray(data)) {
            for (const log of data) {
              if (log.foodItem) foodRepo.upsertFoodItem({ ...log.foodItem, serverId: log.foodItem.id });
            }
            get().fetchLogs(date); // re-read from SQLite after sync
          }
        })
        .catch(() => {});
    }
  },

  addLog: (payload) => {
    const dateStr = format(get().date, 'yyyy-MM-dd');
    foodRepo.addLog({ date: dateStr, ...payload });
    get().fetchLogs();
    // Push to server in background
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.post('/food/log', {
        date: dateStr,
        meal: payload.meal,
        foodItemId: payload.foodItemLocalId
          ? (foodRepo.getFoodItemById(payload.foodItemLocalId) as any)?.serverId ?? undefined
          : undefined,
        recipeId: payload.recipeLocalId ?? undefined,
        servingQty: payload.servingQty,
      }).catch(() => {});
    }
  },

  updateLog: (localId, servingQty) => {
    foodRepo.updateLog(localId, servingQty);
    get().fetchLogs();
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      // Find serverId if available
      api.put(`/food/log/${localId}`, { servingQty }).catch(() => {});
    }
  },

  deleteLog: (localId) => {
    foodRepo.deleteLog(localId);
    get().fetchLogs();
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.delete(`/food/log/${localId}`).catch(() => {});
    }
  },

  searchFoods: async (q) => {
    if (!q.trim()) return [];
    // Local results immediately
    const local = foodRepo.searchFoodItems(q);
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      try {
        const { data } = await api.get('/food/search', { params: { q } });
        if (Array.isArray(data)) {
          for (const item of data) foodRepo.upsertFoodItem({ ...item, serverId: item.id });
          return foodRepo.searchFoodItems(q);
        }
      } catch { /* offline — return local */ }
    }
    // No server: try Open Food Facts directly
    if (!serverUrl && q.length > 2) {
      try {
        const { data } = await api.create({ baseURL: 'https://world.openfoodfacts.org', timeout: 10_000 })
          .get(`/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=true&page_size=20`);
        const products = data?.products ?? [];
        for (const p of products) {
          if (!p.product_name) continue;
          foodRepo.upsertFoodItem({
            name: p.product_name,
            brand: p.brands ?? null,
            barcode: p.code ?? null,
            servingSize: parseFloat(p.serving_quantity) || 100,
            servingUnit: p.serving_quantity_unit || 'g',
            calories: parseFloat(p.nutriments?.energy_kcal_100g) || 0,
            protein: parseFloat(p.nutriments?.proteins_100g) || 0,
            carbs: parseFloat(p.nutriments?.carbohydrates_100g) || 0,
            fat: parseFloat(p.nutriments?.fat_100g) || 0,
            fiber: parseFloat(p.nutriments?.fiber_100g) || null,
            source: 'OPEN_FOOD_FACTS',
          });
        }
        return foodRepo.searchFoodItems(q);
      } catch { /* ignore */ }
    }
    return local;
  },

  scanBarcode: async (barcode) => {
    const local = foodRepo.getFoodItemByBarcode(barcode);
    if (local) return local;

    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      try {
        const { data } = await api.get(`/food/barcode/${barcode}`);
        if (data) {
          const localId = foodRepo.upsertFoodItem({ ...data, serverId: data.id });
          return foodRepo.getFoodItemById(localId);
        }
      } catch { /* server offline or not found */ }
    }

    // Fallback: Open Food Facts directly
    try {
      const { data } = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      ).then((r) => r.json());
      const p = data?.product;
      if (p?.product_name) {
        const localId = foodRepo.upsertFoodItem({
          name: p.product_name,
          brand: p.brands ?? null,
          barcode,
          servingSize: parseFloat(p.serving_quantity) || 100,
          servingUnit: p.serving_quantity_unit || 'g',
          calories: parseFloat(p.nutriments?.energy_kcal_100g) || 0,
          protein: parseFloat(p.nutriments?.proteins_100g) || 0,
          carbs: parseFloat(p.nutriments?.carbohydrates_100g) || 0,
          fat: parseFloat(p.nutriments?.fat_100g) || 0,
          fiber: parseFloat(p.nutriments?.fiber_100g) || null,
          source: 'OPEN_FOOD_FACTS',
        });
        return foodRepo.getFoodItemById(localId);
      }
    } catch { /* not found */ }
    return null;
  },

  createCustomFood: (item) => {
    return foodRepo.createCustomFoodItem(item);
  },

  fetchRecipes: () => {
    try {
      const recipes = foodRepo.getRecipes();
      set({ recipes });
    } catch { /* ignore */ }
    const { serverUrl } = useServerStore.getState();
    if (serverUrl) {
      api.get('/recipes').then(({ data }) => {
        if (Array.isArray(data)) {
          for (const r of data) foodRepo.upsertRecipeFromServer(r);
          set({ recipes: foodRepo.getRecipes() });
        }
      }).catch(() => {});
    }
  },

  getDailyCalories: (from, to) => foodRepo.getDailyCalories(from, to),
  getDayTotals: (date) => foodRepo.getDayTotals(date),
}));
