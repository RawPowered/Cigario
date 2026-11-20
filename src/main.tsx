import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { App } from './App';
import { Website } from './Website';
import './styles.css';

const inPortal = Capacitor.isNativePlatform() || /^\/app(?:\/|$)/.test(location.pathname);
createRoot(document.getElementById('root')!).render(<React.StrictMode>{inPortal?<App/>:<Website/>}</React.StrictMode>);
