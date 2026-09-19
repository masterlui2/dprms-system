/**
 * System: DPRMS
 * Purpose: Render app for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { RouterProvider } from 'react-router-dom';

import { g_objRouter } from './routes';

/** Render app and its available actions. */
export default function App()
{
    return <RouterProvider router={g_objRouter} />;
}
