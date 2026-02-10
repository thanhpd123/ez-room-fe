import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { FavoritesProvider } from './app/context/FavoritesContext';
import { router } from './lib/routers';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FavoritesProvider>
      <RouterProvider router={router} />
    </FavoritesProvider>
  </StrictMode>
);
