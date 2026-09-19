/**
 * System: DPRMS
 * Purpose: Configure authenticated API requests and shared failure diagnostics.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import axios from 'axios';
import { reportError } from '../utils/error_reporting';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api';

const g_objApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 15000,
    withCredentials: true,
    withXSRFToken: true,
});

/** Initialize Laravel's CSRF cookie before sending authentication requests. */
export async function ensureCsrfCookie()
{
    try
    {
        const strCsrfUrl = API_BASE_URL.replace(/\/api\/?$/, '') + '/sanctum/csrf-cookie';
        await axios.get(strCsrfUrl, { withCredentials: true });
    } catch (errOperation)
    {
        reportError(errOperation, 'CSRF initialization failed.');
        throw errOperation;
    }
}

g_objApi.interceptors.request.use((objConfig) =>
{
    const strToken = localStorage.getItem('dprms.auth-token');

    if (strToken)
    {
        objConfig.headers.Authorization = `Bearer ${strToken}`;
    }

    return objConfig;
});

g_objApi.interceptors.response.use(
    (objResponse) => objResponse,
    (errError) =>
    {
        if (axios.isAxiosError(errError) && errError.response?.status === 401)
        {
            localStorage.removeItem('dprms.auth-token');
        }

        reportError(errError, 'An API request failed.');
        return Promise.reject(errError);
    },
);

export default g_objApi;
