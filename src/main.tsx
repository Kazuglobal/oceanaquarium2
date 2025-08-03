import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppSpace from './AppSpace';
import AppSky from './AppSky';
import AppNature from './AppNature';
import FireworksWorld from './scenes/FireworksWorld';
import LandingPage from './LandingPage';
import React, { useState } from 'react';
import './index.css';
import { Environment } from './LandingPage.tsx';
// import { StagewiseToolbar } from '@stagewise/toolbar-react';
// import { ReactPlugin } from '@stagewise-plugins/react';

const Root: React.FC = () => {
  const [env, setEnv] = useState<Environment | null>(null);
  if (!env) return <LandingPage onSelect={(e) => setEnv(e)} />;
  if (env === 'space') return <AppSpace />;
  if (env === 'sky') return <AppSky />;
  if (env === 'nature') return <AppNature />;
  if (env === 'fireworks') return <FireworksWorld />;
  return <App key={env} env={env} />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* {import.meta.env.DEV && (
      <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
    )} */}
    <Root />
  </StrictMode>
);
