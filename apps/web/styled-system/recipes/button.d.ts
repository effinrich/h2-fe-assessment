import type { ConditionalValue } from '../types/system';
import type { RecipeRuntimeFn, RecipeVariantMap } from '../types/recipe';

export type ButtonVariant = {
  size?: "2xl" | "2xs" | "lg" | "md" | "sm" | "xl" | "xs"
  variant?: "outline" | "plain" | "solid" | "subtle" | "surface"
}

export type ButtonVariantProps = {
  [K in keyof ButtonVariant]?: ConditionalValue<ButtonVariant[K]>
}

export type ButtonVariantMap = RecipeVariantMap<ButtonVariant>

export type ButtonRecipe = RecipeRuntimeFn<ButtonVariantProps, ButtonVariantMap>

export declare const button: ButtonRecipe;