export const navigationItems = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Programs', href: '#programs' },
  { label: 'How It Works', href: '#process' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

export const portalFeatures = [
  {
    title: 'Centralized Records',
    description: 'Keep all your project documents and updates in one secure place.',
  },
  {
    title: 'Real Progress Tracking',
    description: 'Follow milestones and stay updated on the status of your assistance.',
  },
  {
    title: 'Direct Communication',
    description: 'Stay in touch with DOST staff handling your project at every step.',
  },
]

export const programCards = [
  {
    label: 'SETUP',
    title: 'DOST SETUP',
    description:
      'Small Enterprise Technology Upgrading Program — technology assistance and equipment support that helps MSMEs improve productivity and product quality.',
    tone: 'blue',
  },
  {
    label: 'GIA',
    title: 'DOST Grants-in-Aid',
    description:
      'Funding support for innovation, research, and community development projects that create real impact for Filipino enterprises and communities.',
    tone: 'orange',
  },
  {
    label: 'DEVELOPMENT',
    title: 'MSME Development',
    description:
      'Capability-building programs that strengthen productivity, competitiveness, and sustainability across every MSME sector in the country.',
    tone: 'orange',
  },
]

export const processSteps = [
  {
    title: 'Check Eligibility',
    description:
      'Beneficiaries review basic requirements, business readiness, and the type of technology support needed.',
  },
  {
    title: 'Submit Request',
    description:
      'MSMEs prepare business details, project objectives, proposed equipment, and supporting documents.',
  },
  {
    title: 'Evaluation and Matching',
    description:
      'DOST teams assess technical fit, resource requirements, expected productivity gains, and implementation readiness.',
  },
  {
    title: 'Implementation Monitoring',
    description:
      'Approved projects move through milestones, progress checks, resource tracking, and outcome reporting.',
  },
]

export const benefits = [
  {
    title: 'Clear application journey',
    description: 'MSME beneficiaries can understand where they are in the process and what comes next.',
  },
  {
    title: 'Technology-focused guidance',
    description: 'Program content highlights practical upgrading areas for production, products, and retail operations.',
  },
  {
    title: 'Transparent milestones',
    description: 'The structure prepares the system for tracking implementation progress and project outcomes.',
  },
  {
    title: 'Data-ready foundation',
    description: 'The frontend supports future integration with analytics and prediction services for DPRMS.',
  },
]

export const faqs = [
  {
    question: 'Who is this portal for?',
    answer:
      'This public homepage is for MSME beneficiaries who want to understand DOST technology upgrading support and the monitoring process.',
  },
  {
    question: 'Can beneficiaries submit applications here?',
    answer:
      'The current page is frontend-only. Application and account features can be connected once the Laravel API endpoints are ready.',
  },
  {
    question: 'What type of enterprises are supported?',
    answer:
      'The homepage is structured around manufacturing, product-based, and food and retail enterprises, matching the SETUP-focused hero.',
  },
  {
    question: 'Will this connect to prediction features later?',
    answer:
      'Yes. The organized React structure keeps room for future FastAPI-based prediction and analytics workflows.',
  },
]
