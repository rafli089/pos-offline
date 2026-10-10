import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { seedDatabase } from './lib/seedDb';

seedDatabase().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
  );
}).catch((err) => {
  console.error('Failed to seed database:', err);
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
  );
});
