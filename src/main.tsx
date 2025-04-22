import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import LandingPage from './LandingPage.tsx';
import React, { useState } from 'react';
import './index.css';
import { Environment } from './LandingPage.tsx';

const Root: React.FC = () => {
  const [env, setEnv] = useState<Environment | null>(null);
  return env ? (
    <App key={env} env={env} />
  ) : (
    <LandingPage onSelect={(e) => setEnv(e)} />
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
