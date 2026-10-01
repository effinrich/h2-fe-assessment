import type { ConditionalValue } from '../types/system';
import type { RecipeRuntimeFn, RecipeVariantMap } from '../types/recipe';

export type AbsoluteCenterVariant = {
  axis?: "both" | "horizontal" | "vertical"
}

export type AbsoluteCenterVariantProps = {
  [K in keyof AbsoluteCenterVariant]?: ConditionalValue<AbsoluteCenterVariant[K]>
}

export type AbsoluteCenterVariantMap = RecipeVariantMap<AbsoluteCenterVariant>

export type AbsoluteCenterRecipe = RecipeRuntimeFn<AbsoluteCenterVariantProps, AbsoluteCenterVariantMap>

export declare const absoluteCenter: AbsoluteCenterRecipe;