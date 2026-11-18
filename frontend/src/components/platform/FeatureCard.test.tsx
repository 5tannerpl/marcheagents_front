import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeatureCard } from './FeatureCard';
import { featureRegistry, getFeatureById } from '../../features/registry';

describe('FeatureCard', () => {
  it('renders an available feature with demo links', () => {
    const feature = getFeatureById('email-support')!;
    render(
      <MemoryRouter>
        <FeatureCard feature={feature} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /try demo/i })).toHaveAttribute(
      'href',
      '/features/email-support/demo',
    );
  });

  it('renders coming-soon features without any launch CTA', () => {
    const comingSoon = featureRegistry.find((f) => f.status === 'coming-soon')!;
    render(
      <MemoryRouter>
        <FeatureCard feature={comingSoon} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
