import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppSpace from './AppSpace';
import LandingPage from './LandingPage.tsx';
import React, { useState } from 'react';
import './index.css';
import { Environment } from './LandingPage.tsx';

const Root: React.FC = () => {
  const [env, setEnv] = useState<Environment | null>(null);
  if (!env) return <LandingPage onSelect={(e) => setEnv(e)} />;
  if (env === 'space') return <AppSpace />;
  return <App key={env} env={env} />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
