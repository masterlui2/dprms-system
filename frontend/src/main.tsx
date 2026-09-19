/**
 * System: DPRMS
 * Purpose: Mount the DPRMS React application.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import 'sweetalert2/dist/sweetalert2.min.css';
import App from './App';
import { ApplicationErrorBoundary } from './components/common/ApplicationErrorBoundary';
import { AsyncErrorNotice } from './components/common/AsyncErrorNotice';
import './index.css';

const g_objRootElement = document.getElementById('root');

if (!g_objRootElement)
{
    throw new Error('Root element was not found.');
}

createRoot(g_objRootElement).render(
    <StrictMode>
        <ApplicationErrorBoundary>
            <AsyncErrorNotice />
            <App />
        </ApplicationErrorBoundary>
    </StrictMode>,
);
