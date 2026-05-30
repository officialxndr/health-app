interface Activity {
  name: string
  met: number
  emoji: string
}

export const ACTIVITIES: Activity[] = [
  { name: 'Walking (brisk)', met: 4.3, emoji: '🚶' },
  { name: 'Walking (casual)', met: 3.0, emoji: '🚶' },
  { name: 'Jogging (5 mph)', met: 8.0, emoji: '🏃' },
  { name: 'Cycling (moderate)', met: 8.0, emoji: '🚴' },
  { name: 'Swimming (moderate)', met: 6.0, emoji: '🏊' },
  { name: 'Elliptical (moderate)', met: 5.0, emoji: '⚙️' },
  { name: 'Bodyweight circuit', met: 5.0, emoji: '💪' },
  { name: 'Yoga', met: 3.0, emoji: '🧘' },
]

export function minutesToBurnCalories(activity: Activity, weightKg: number, targetCals: number): number {
  const calsPerMinute = (activity.met * 3.5 * weightKg) / 200
  return Math.ceil(targetCals / calsPerMinute)
}

export function activitySuggestions(
  targetCals: number,
  weightKg: number
): Array<{ activity: Activity; minutes: number }> {
  return ACTIVITIES.slice(0, 4).map((activity) => ({
    activity,
    minutes: minutesToBurnCalories(activity, weightKg, targetCals),
  }))
}
