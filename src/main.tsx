import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppWithLocale } from './app/AppWithLocale';
import './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithLocale />
  </StrictMode>
);
