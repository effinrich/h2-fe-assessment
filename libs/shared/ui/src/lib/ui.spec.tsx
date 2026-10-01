import { render } from '@testing-library/react';

import H2FeUi from './ui';

describe('H2FeUi', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<H2FeUi />);
    expect(baseElement).toBeTruthy();
  });
  
});
