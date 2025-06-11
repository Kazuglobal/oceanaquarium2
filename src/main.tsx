import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppSpace from './AppSpace';
import AppSky from './AppSky';
import AppNature from './AppNature';
import FireworksWorld from './scenes/FireworksWorld';
import KidsLandingPage from './KidsLandingPage';
import React, { useState } from 'react';
import './index.css';
import { Environment } from './LandingPage.tsx';

const Root: React.FC = () => {
  const [env, setEnv] = useState<Environment | null>(null);
  if (!env) return <KidsLandingPage onSelect={(e) => setEnv(e)} />;
  if (env === 'space') return <AppSpace />;
  if (env === 'sky') return <AppSky />;
  if (env === 'nature') return <AppNature />;
  if (env === 'fireworks') return <FireworksWorld />;
  return <App key={env} env={env} />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
