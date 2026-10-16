import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createApiClient } from '@tc/api-client';
import { ApiProvider } from '@tc/core';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';
import { AuthProvider } from './lib/auth';
import { env } from './lib/env';
import { supabase } from './lib/supabase';

const api = createApiClient({
  baseUrl: env.apiBaseUrl,
  getToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
});
const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApiProvider client={api}>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ApiProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
