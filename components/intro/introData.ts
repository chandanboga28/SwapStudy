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
  secondaryBackground: '#F5F8FF',
  primaryCobaltBlue: '#2855D9',
  deepBlue: '#183B9B',
  brightYellow: '#FFD43B',
  softYellow: '#FFF1AD',
  lightBlue: '#DCE7FF',
  textPrimary: '#17213A',
  textSecondary: '#64718A',
  borderLight: '#E5EAF5',
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
    accentColor: '#FFD43B',
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
    accentColor: '#2855D9',
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
    accentColor: '#FFD43B',
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
    accentColor: '#2855D9',
    durationSeconds: 8.5,
  },
];

export const INTRO_FINAL_TAGLINE = 'Learn a skill. Teach a skill. Grow together.';
