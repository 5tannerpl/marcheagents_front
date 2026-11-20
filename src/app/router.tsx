import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from './App';
import { LandingPage } from '../pages/LandingPage';
import { FeatureCatalogPage } from '../pages/FeatureCatalogPage';
import { FeatureOverviewPage } from '../pages/FeatureOverviewPage';
import { PublicDemoPage } from '../pages/PublicDemoPage';
import { DataProtectionPage } from '../pages/DataProtectionPage';
import { LiveWorkspacePage } from '../pages/LiveWorkspacePage';
import { ContactPage } from '../pages/ContactPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'features', element: <FeatureCatalogPage /> },
      { path: 'features/:featureId', element: <FeatureOverviewPage /> },
      { path: 'features/email-support/demo', element: <PublicDemoPage /> },
      {
        path: 'features/email-support/data-protection',
        element: <DataProtectionPage />,
      },
      { path: 'app/features/email-support', element: <LiveWorkspacePage /> },
      {
        path: 'app/agent-ops',
        lazy: async () => {
          const { AgentOpsDashboardPage } = await import('../pages/agent-ops/AgentOpsDashboardPage');
          return { Component: AgentOpsDashboardPage };
        },
      },
      { path: 'app/*', element: <LiveWorkspacePage /> },
      { path: 'contact', element: <ContactPage /> },
      // Legacy compatibility redirects
      {
        path: 'demo',
        element: <Navigate to="/features/email-support/demo" replace />,
      },
      {
        path: 'demo/security',
        element: (
          <Navigate to="/features/email-support/data-protection" replace />
        ),
      },
      {
        path: 'features/email-support/security',
        element: (
          <Navigate to="/features/email-support/data-protection" replace />
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
