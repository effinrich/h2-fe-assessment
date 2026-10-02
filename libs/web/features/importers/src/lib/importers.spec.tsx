import { render } from '@testing-library/react'

import H2FeImporters from './importers'

describe('H2FeImporters', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<H2FeImporters />)
    expect(baseElement).toBeTruthy()
  })
})
