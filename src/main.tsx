import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';

Amplify.configure(awsconfig);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Ocorreu um erro no Portal Faith-Hub">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

