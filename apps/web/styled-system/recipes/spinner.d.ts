import type { ConditionalValue } from '../types/system';
import type { RecipeRuntimeFn, RecipeVariantMap } from '../types/recipe';

export type SpinnerVariant = {
  size?: "2xl" | "inherit" | "lg" | "md" | "sm" | "xl" | "xs"
}

export type SpinnerVariantProps = {
  [K in keyof SpinnerVariant]?: ConditionalValue<SpinnerVariant[K]>
}

export type SpinnerVariantMap = RecipeVariantMap<SpinnerVariant>

export type SpinnerRecipe = RecipeRuntimeFn<SpinnerVariantProps, SpinnerVariantMap>

export declare const spinner: SpinnerRecipe;