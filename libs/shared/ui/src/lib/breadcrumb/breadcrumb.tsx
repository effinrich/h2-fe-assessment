import { Breadcrumb as ChakraBreadcrumb } from '@chakra-ui/react'
import { Fragment, type ReactNode } from 'react'

export interface BreadcrumbItemData {
  label: ReactNode
  /** Ignored on the last item, which renders as the current page. */
  href?: string
}

export interface BreadcrumbProps extends Omit<ChakraBreadcrumb.RootProps, 'children'> {
  items: BreadcrumbItemData[]
  /** Replaces the default chevron. */
  separator?: ReactNode
}

export function Breadcrumb({ items, separator, ...rootProps }: BreadcrumbProps) {
  return (
    <ChakraBreadcrumb.Root {...rootProps}>
      <ChakraBreadcrumb.List>
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <Fragment key={index}>
              <ChakraBreadcrumb.Item>
                {last ? (
                  <ChakraBreadcrumb.CurrentLink>{item.label}</ChakraBreadcrumb.CurrentLink>
                ) : (
                  <ChakraBreadcrumb.Link href={item.href}>{item.label}</ChakraBreadcrumb.Link>
                )}
              </ChakraBreadcrumb.Item>
              {last ? null : separator ? (
                <ChakraBreadcrumb.Separator>{separator}</ChakraBreadcrumb.Separator>
              ) : (
                <ChakraBreadcrumb.Separator />
              )}
            </Fragment>
          )
        })}
      </ChakraBreadcrumb.List>
    </ChakraBreadcrumb.Root>
  )
}
