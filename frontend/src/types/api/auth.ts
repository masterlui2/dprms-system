/**
 * System: DPRMS
 * Purpose: Describe the current auth API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ApplicationProgram } from '../application';

export interface BackendUser
{
    id?: number;
    email: string;
    name: string;
    program?: ApplicationProgram;
    program_type?: ApplicationProgram;
    role?: string;
    roles?: Array<{ name?: string; code?: string; program_type?: ApplicationProgram; }>;
}

export interface LoginResponse
{
    data: {
        token: string;
        user: BackendUser;
    };
    message: string;
}

export interface RegisterPayload
{
    email: string;
    name: string;
    password: string;
    password_confirmation: string;
    role: 'MSME_PROPONENT' | 'GIA_PROJECT_LEADER';
}

export interface ValidationErrorPayload
{
    errors?: Record<string, string[]>;
    message?: string;
}

export interface RegisterResponse
{
    data: {
        token: string;
        user: BackendUser;
    };
    message: string;
}
