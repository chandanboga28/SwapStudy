export interface IntroSceneSpec {
  id: number;
  eyebrow: string;
  title: string;
  highlightText?: string;
  subtitle: string;
  accentColor: string;
  badgeText: string;
  durationSeconds: number;
}

export const INTRO_PALETTE = {
  background: '#FFFFFF',
  secondaryBackground: '#F5F1FF',
  primaryCobaltBlue: '#3979F6',
  deepBlue: '#7655E8',
  brightYellow: '#7655E8',
  softYellow: '#EAE3FF',
  lightBlue: '#E1EBFF',
  textPrimary: '#242044',
  textSecondary: '#77758F',
  borderLight: '#E8E5F5',
} as const;

export const INTRO_SCENES: IntroSceneSpec[] = [
  {
    id: 0,
    eyebrow: '01 · The Problem',
    badgeText: 'Curiosity Meets Gaps',
    title: 'Everyone knows something. Nobody knows everything.',
    highlightText: 'everything.',
    subtitle:
      "You might know coding, design or photography. But there's always something new you want to learn.",
    accentColor: '#7655E8',
    durationSeconds: 7.5,
  },
  {
    id: 1,
    eyebrow: '02 · The Connection',
    badgeText: 'Complementary Peers',
    title: 'What if students could learn from each other?',
    highlightText: 'each other?',
    subtitle:
      'Connect with students who already have the skills you want to learn.',
    accentColor: '#3979F6',
    durationSeconds: 7.5,
  },
  {
    id: 2,
    eyebrow: '03 · The Exchange',
    badgeText: 'Fair Time Credits',
    title: 'Teach what you know. Earn credits.',
    highlightText: 'Earn credits.',
    subtitle:
      'Share your knowledge, help another student and earn credits for every completed learning session.',
    accentColor: '#7655E8',
    durationSeconds: 7.5,
  },
  {
    id: 3,
    eyebrow: '04 · The Growth',
    badgeText: 'Campus Community',
    title: 'Learn more. Share more. Grow together.',
    highlightText: 'Grow together.',
    subtitle:
      'Discover skills, exchange knowledge and build meaningful connections within your college community.',
    accentColor: '#3979F6',
    durationSeconds: 8.5,
  },
];

export const INTRO_FINAL_TAGLINE = 'Learn a skill. Teach a skill. Grow together.';
