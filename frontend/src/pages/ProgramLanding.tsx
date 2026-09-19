/**
 * System: DPRMS
 * Purpose: Render program landing for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { LucideIcon } from 'lucide-react';
import
{
    ArrowRight,
    BadgeCheck,
    ClipboardCheck,
    FileText,
    Landmark,
    Microscope,
    PackageCheck,
    ShieldCheck,
    UsersRound,
    Wrench,
} from 'lucide-react';
import { useEffect } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';

import giaImage from '../assets/gia.png';
import setupImage from '../assets/setup.png';
import { SiteFooter } from '../components/landing/SiteFooter';
import { SiteHeader } from '../components/landing/SiteHeader';
import { getMockUser } from '../lib/mock_auth';
import { getProgramRegistrationUrl, hasProgramAccess } from '../lib/program_access';
import type { ApplicationProgram } from '../types/application';

type ProgramContent = {
    accent: string;
    applicantLabel: string;
    applyTo: string;
    benefits: Array<{ description: string; icon: LucideIcon; title: string; }>;
    description: string;
    eyebrow: string;
    heroAlt: string;
    heroImage: string;
    process: Array<{ description: string; title: string; }>;
    requirements: Array<string>;
    title: string;
};

const PROGRAM_CONTENT: Record<ApplicationProgram, ProgramContent> = {
    GIA: {
        accent: 'bg-[#f59e0b]',
        applicantLabel: 'For communities, schools, LGUs, and partner organizations',
        applyTo: '/programs/gia/register',
        benefits: [
            {
                description:
                    'Support for public-benefit science, technology, research, and community development initiatives.',
                icon: Microscope,
                title: 'Mission-led projects',
            },
            {
                description:
                    'A structured submission path for proposals, work plans, budget details, and endorsements.',
                icon: ClipboardCheck,
                title: 'Clear proposal package',
            },
            {
                description:
                    'Designed for milestone reporting, project updates, and official review communication.',
                icon: UsersRound,
                title: 'Collaborative monitoring',
            },
        ],
        description:
            'Prepare a Grants-in-Aid proposal for research, capability building, livelihood support, training, and science-based interventions that deliver public value.',
        eyebrow: 'Grants-in-Aid Program',
        heroAlt: 'GIA program community and science project',
        heroImage: giaImage,
        process: [
            {
                title: 'Confirm project fit',
                description:
                    'Check that the proposal addresses a public need through science, technology, training, research, or community intervention.',
            },
            {
                title: 'Register the proposal',
                description:
                    'Complete one simplified online form for the proponent, project, implementation approach, and expected results.',
            },
            {
                title: 'Upload final documents',
                description:
                    'After submission, upload the checklist generated for Private Sector, Higher Education, or Barangay LGU proponents.',
            },
            {
                title: 'Track implementation',
                description:
                    'After approval, monitor milestones, deliverables, reporting requirements, and official notices.',
            },
        ],
        requirements: [
            'Proponent category and organization information',
            'Project leader and contact details',
            'Project summary, rationale, and objectives',
            'Implementation approach and expected outputs',
            'Supporting files are uploaded separately after submission',
        ],
        title: 'GIA Project Support Homepage',
    },
    SETUP: {
        accent: 'bg-[#0f53b7]',
        applicantLabel: 'For MSMEs and enterprise proponents',
        applyTo: '/programs/setup/register',
        benefits: [
            {
                description:
                    'Support for productivity improvement through technology upgrading, equipment, and process enhancement.',
                icon: Wrench,
                title: 'Enterprise upgrading',
            },
            {
                description:
                    'Guidance for preparing quotations, business profiles, production details, and improvement targets.',
                icon: PackageCheck,
                title: 'Practical requirements',
            },
            {
                description:
                    'A focused path for tracking validation, technical assessment, approval, and implementation updates.',
                icon: ShieldCheck,
                title: 'Structured assistance',
            },
        ],
        description:
            'Prepare a SETUP application for technology upgrading, equipment support, packaging improvement, productivity enhancement, and enterprise competitiveness.',
        eyebrow: 'Small Enterprise Technology Upgrading Program',
        heroAlt: 'SETUP program enterprise technology upgrading',
        heroImage: setupImage,
        process: [
            {
                title: 'Profile the enterprise',
                description:
                    'Prepare business information, production capacity, current constraints, and target improvements.',
            },
            {
                title: 'Document the request',
                description:
                    'Complete one simplified online form covering the enterprise, operations, market, and proposed intervention.',
            },
            {
                title: 'Upload requirements',
                description:
                    'After submission, use the separate dashboard checklist to upload supporting documents.',
            },
            {
                title: 'Monitor assistance',
                description:
                    'Track approval status, equipment issuance, repayment schedules, reports, and compliance notices.',
            },
        ],
        requirements: [
            'Basic enterprise and contact information',
            'Current operations and technology needs',
            'Management and marketing information',
            'Annual sales and employee count',
            'Supporting files are uploaded separately after submission',
        ],
        title: 'SETUP Enterprise Support Homepage',
    },
};

/** Normalize program. */
function _normalizeProgram(strValue = ''): ApplicationProgram | null
{
    const strProgram = strValue.toUpperCase();

    if (strProgram === 'GIA' || strProgram === 'SETUP')
    {
        return strProgram;
    }

    return null;
}

/** Render program landing and its available actions. */
export function ProgramLanding()
{
    const { program: strProgram = '' } = useParams();
    const objLocation = useLocation();
    const strNormalizedProgram = _normalizeProgram(strProgram);
    const objUser = getMockUser();

    useEffect(() =>
    {
        if (!objLocation.hash)
        {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        window.requestAnimationFrame(() =>
        {
            document.querySelector(objLocation.hash)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    }, [objLocation.hash, objLocation.pathname]);

    if (!strNormalizedProgram)
    {
        return <Navigate replace to="/" />;
    }

    if (!objUser && !hasProgramAccess(strNormalizedProgram))
    {
        return (
            <Navigate
                replace
                state={{ from: objLocation.pathname }}
                to={getProgramRegistrationUrl(strNormalizedProgram)}
            />
        );
    }

    const objContent = PROGRAM_CONTENT[strNormalizedProgram];

    return (
        <div className="min-h-screen bg-white text-slate-950">
            <SiteHeader />
            <main>
                <section className="bg-white">
                    <div className="relative overflow-hidden bg-slate-950">
                        <img
                            alt={objContent.heroAlt}
                            className="h-[560px] w-full object-cover sm:h-[680px] lg:h-[780px] xl:h-[820px]"
                            src={objContent.heroImage}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/35 via-transparent to-transparent" />
                        <div className="absolute bottom-8 left-[clamp(1.25rem,6vw,7rem)] sm:bottom-16 lg:bottom-24">
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f4c542] px-5 text-sm font-black text-[#073b82] shadow-2xl shadow-blue-950/25 transition hover:bg-[#ffd45f]"
                                    to={objContent.applyTo}
                                >
                                    {strNormalizedProgram === 'SETUP'
                                        ? 'Submit Application'
                                        : 'Submit Proposal'}
                                    <ArrowRight className="size-4" />
                                </Link>
                                <a
                                    className="inline-flex h-12 items-center justify-center rounded-lg border border-[#c6d7ed] bg-white px-5 text-sm font-black text-[#073b82] shadow-2xl shadow-blue-950/15 transition hover:border-blue-300 hover:bg-blue-50"
                                    href="#requirements"
                                >
                                    View requirements
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white px-4 py-20 sm:px-6 lg:px-8" id="about">
                    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f53b7]">
                                Program Overview
                            </p>
                            <h2 className="mt-3 text-3xl font-black leading-tight text-[#073b82] sm:text-4xl">
                                {objContent.applicantLabel}
                            </h2>
                            <p className="mt-4 text-base leading-8 text-slate-600">
                                {objContent.description} This page gives proponents a focused view
                                of the program before proceeding to the application form.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {objContent.benefits.map((objBenefit) =>
                            {
                                const Icon = objBenefit.icon;

                                return (
                                    <article
                                        className="rounded-lg border border-[#d8e5f2] bg-[#f8fbff] p-5"
                                        key={objBenefit.title}
                                    >
                                        <div
                                            className={`grid size-11 place-items-center rounded-lg ${objContent.accent} text-white`}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <h3 className="mt-4 text-lg font-black text-[#073b82]">
                                            {objBenefit.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {objBenefit.description}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section
                    className="border-y border-[#d8e5f2] bg-[#eef5fb] px-4 py-20 sm:px-6 lg:px-8"
                    id="requirements"
                >
                    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f53b7]">
                                Requirements
                            </p>
                            <h2 className="mt-3 text-3xl font-black text-[#073b82] sm:text-4xl">
                                Prepare these before applying
                            </h2>
                            <p className="mt-4 text-base leading-8 text-slate-600">
                                Requirements may vary after screening, but these documents help
                                reviewers understand the request and route it to the correct
                                evaluation flow.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {objContent.requirements.map((strRequirement) => (
                                <div
                                    className="flex items-start gap-3 rounded-lg border border-[#d8e5f2] bg-white px-4 py-4"
                                    key={strRequirement}
                                >
                                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#073b82] text-white">
                                        <FileText className="size-4" />
                                    </span>
                                    <span className="text-sm font-bold leading-6 text-slate-700">
                                        {strRequirement}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white px-4 py-20 sm:px-6 lg:px-8" id="process">
                    <div className="mx-auto max-w-7xl">
                        <div className="max-w-3xl">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f53b7]">
                                How to Apply
                            </p>
                            <h2 className="mt-3 text-3xl font-black text-[#073b82] sm:text-4xl">
                                From preparation to monitoring
                            </h2>
                        </div>

                        <div className="mt-10 grid gap-5 lg:grid-cols-4">
                            {objContent.process.map((objStep, intIndex) => (
                                <article
                                    className="rounded-lg border border-[#d8e5f2] bg-white p-5 shadow-sm"
                                    key={objStep.title}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="grid size-11 place-items-center rounded-lg bg-[#07195f] text-white">
                                            {intIndex === 0 ? (
                                                <BadgeCheck className="size-5" />
                                            ) : null}
                                            {intIndex === 1 ? (
                                                <FileText className="size-5" />
                                            ) : null}
                                            {intIndex === 2 ? (
                                                <Landmark className="size-5" />
                                            ) : null}
                                            {intIndex === 3 ? (
                                                <ClipboardCheck className="size-5" />
                                            ) : null}
                                        </span>
                                        <span className="text-xs font-black uppercase text-[#0f53b7]">
                                            Step {intIndex + 1}
                                        </span>
                                    </div>
                                    <h3 className="mt-5 text-xl font-black text-slate-950">
                                        {objStep.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">
                                        {objStep.description}
                                    </p>
                                </article>
                            ))}
                        </div>

                        <div className="mt-10 rounded-lg bg-[#07195f] px-5 py-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
                            <div>
                                <p className="text-sm font-black uppercase text-blue-100">
                                    Ready to continue?
                                </p>
                                <p className="mt-2 text-xl font-black">
                                    {strNormalizedProgram === 'SETUP'
                                        ? 'Register your SETUP proposal using the online form.'
                                        : `Proceed to the official ${strNormalizedProgram} application form.`}
                                </p>
                            </div>
                            <Link
                                className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f4c542] px-5 text-sm font-black text-[#073b82] transition hover:bg-[#ffd45f] sm:mt-0"
                                to={objContent.applyTo}
                            >
                                {strNormalizedProgram === 'SETUP'
                                    ? 'Submit Application'
                                    : 'Submit Proposal'}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    ); // end return
} /* end ProgramLanding */
