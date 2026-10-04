import { Avatar as ChakraAvatar } from '@chakra-ui/react'
import type { ImgHTMLAttributes, ReactElement } from 'react'

export interface AvatarProps extends ChakraAvatar.RootProps {
  /** Used for the initials fallback and the image's alt text. */
  name?: string
  src?: string
  srcSet?: string
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading']
  /** Shown instead of initials when there is no `name`. */
  icon?: ReactElement
}

export function Avatar({ name, src, srcSet, loading, icon, children, ...rootProps }: AvatarProps) {
  return (
    <ChakraAvatar.Root {...rootProps}>
      <ChakraAvatar.Fallback name={name}>{icon}</ChakraAvatar.Fallback>
      {src || srcSet ? (
        <ChakraAvatar.Image src={src} srcSet={srcSet} loading={loading} alt={name} />
      ) : null}
      {children}
    </ChakraAvatar.Root>
  )
}
