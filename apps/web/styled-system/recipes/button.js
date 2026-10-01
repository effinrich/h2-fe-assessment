import { createRecipe } from './runtime';

const buttonConfig = {"name":"button","defaultVariants":{"size":"md","variant":"solid"},"variantMap":{"size":["2xl","2xs","lg","md","sm","xl","xs"],"variant":["outline","plain","solid","subtle","surface"]}}

export const button = /* @__PURE__ */ createRecipe(buttonConfig)