import { User, Skill, Session, SmartMatch, MatchType, SkillSwapInvitation } from '@/types';

// Stop words to ignore during token-based skill matching
const STOP_WORDS = new Set([
  'and',
  '&',
  'or',
  'for',
  'from',
  'with',
  'the',
  'a',
  'an',
  'in',
  'of',
  'to',
  'basics',
  'mastery',
  'introduction',
  'scratch',
  'advanced',
  'beginner',
  'intermediate',
  'modern',
  'short-form',
  'short',
  'form',
]);

// Semantic concept clusters to identify domain equivalences
const CONCEPT_CLUSTERS: string[][] = [
  // UI/UX & Design
  ['ui', 'ux', 'ui/ux', 'ui ux', 'figma', 'wireframing', 'prototyping', 'product design', 'user experience', 'user interface', 'design systems'],
  // Python & Data Science
  ['python', 'scipy', 'django', 'flask', 'numpy', 'pandas', 'python programming'],
  // Web Development
  ['react', 'nextjs', 'next.js', 'react.js', 'web development', 'frontend', 'fullstack', 'typescript', 'tailwind', 'javascript'],
  // Video & Media Production
  ['video', 'video editing', 'premiere', 'premiere pro', 'adobe premiere', 'davinci', 'storytelling', 'film', 'editing'],
  // Public Speaking & Communication
  ['public speaking', 'speaking', 'pitch', 'pitching', 'presentation', 'speech', 'interview', 'interview communication', 'debate'],
  // Algorithms & Computer Science
  ['algorithms', 'data structures', 'dsa', 'leetcode', 'competitive programming', 'data structures & algorithms'],
  // Mathematics
  ['linear algebra', 'algebra', 'matrix', 'calculus', 'multivariable', 'applied mathematics', 'math'],
];

/**
 * Normalizes a skill title into clean, comparable tokens.
 */
export function normalizeSkill(skill: string): string[] {
  if (!skill) return [];
  // Clean punctuation and replace with spaces
  const cleaned = skill
    .toLowerCase()
    .replace(/[/&\\#,+()$~%.'":*?<>{}_-]/g, ' ')
    .trim();

  // Split into tokens, filter out empty and stop words
  return cleaned
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Determines whether two skill strings match, taking into account:
 * 1. Normalized string equality
 * 2. Substring matching (e.g. "Python" in "Python Programming")
 * 3. Token overlap (e.g. "Video Editing" and "Short-Form Video Editing")
 * 4. Semantic domain clusters (e.g. "UI UX Design" and "UI/UX Design & Figma")
 */
export function isSkillMatch(skillA: string, skillB: string): boolean {
  if (!skillA || !skillB) return false;

  const rawA = skillA.trim().toLowerCase();
  const rawB = skillB.trim().toLowerCase();

  // 1. Direct equality
  if (rawA === rawB) return true;

  // 2. Direct string containment
  if (rawA.includes(rawB) || rawB.includes(rawA)) return true;

  // 3. Clean string comparison
  const cleanA = rawA.replace(/[/&\\#,+()$~%.'":*?<>{}_-]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanB = rawB.replace(/[/&\\#,+()$~%.'":*?<>{}_-]/g, ' ').replace(/\s+/g, ' ').trim();

  if (cleanA === cleanB) return true;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

  // 4. Token overlap
  const tokensA = normalizeSkill(skillA);
  const tokensB = normalizeSkill(skillB);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  const setB = new Set(tokensB);
  const intersection = tokensA.filter((t) => setB.has(t));

  if (intersection.length > 0) {
    // If the intersection represents significant overlap
    return true;
  }

  // 5. Concept cluster matching
  for (const cluster of CONCEPT_CLUSTERS) {
    const aMatchesCluster = cluster.some((phrase) => cleanA.includes(phrase) || tokensA.includes(phrase));
    const bMatchesCluster = cluster.some((phrase) => cleanB.includes(phrase) || tokensB.includes(phrase));

    if (aMatchesCluster && bMatchesCluster) {
      return true;
    }
  }

  return false;
}

/**
 * Finds an active marketplace skill listing for a candidate that matches a given skill title.
 */
export function findBestSkillListing(
  candidateId: string,
  skillTitle: string,
  allSkills: Skill[]
): Skill | null {
  const candidateSkills = allSkills.filter((s) => s.teacherId === candidateId);
  if (candidateSkills.length === 0) return null;

  // First try direct match with skill title
  const directMatch = candidateSkills.find((s) => isSkillMatch(s.title, skillTitle));
  if (directMatch) return directMatch;

  // Second try topic match inside the skill syllabus
  const topicMatch = candidateSkills.find((s) =>
    s.topics.some((topic) => isSkillMatch(topic, skillTitle))
  );
  if (topicMatch) return topicMatch;

  // Fallback to highest rated skill by this candidate
  return candidateSkills.sort((a, b) => b.teacherRating - a.teacherRating)[0];
}

/**
 * Computes deterministic, ranked smart matches for a student.
 */
export function calculateSmartMatches(
  currentUser: User | null,
  allUsers: User[],
  allSkills: Skill[],
  sessions: Session[],
  invitations?: SkillSwapInvitation[]
): SmartMatch[] {
  if (!currentUser) return [];

  // Gather all skills current user can teach (profile + published listings)
  const userPublishedSkills = allSkills
    .filter((s) => s.teacherId === currentUser.id)
    .map((s) => s.title);
  const userTeaches = Array.from(new Set([...(currentUser.skillsToTeach || []), ...userPublishedSkills]));
  const userWantsToLearn = currentUser.skillsToLearn || [];

  const matches: SmartMatch[] = [];

  for (const candidate of allUsers) {
    // Exclude current student
    if (candidate.id === currentUser.id) continue;

    // Candidate skills
    const candidatePublishedSkills = allSkills
      .filter((s) => s.teacherId === candidate.id)
      .map((s) => s.title);
    const candidateTeaches = Array.from(
      new Set([...(candidate.skillsToTeach || []), ...candidatePublishedSkills])
    );
    const candidateWantsToLearn = candidate.skillsToLearn || [];

    // 1. Check if candidate teaches something currentUser wants to learn
    let candidateTeachesLearnerMatch: { candidateSkill: string; userWish: string } | null = null;
    for (const wish of userWantsToLearn) {
      const matched = candidateTeaches.find((cSkill) => isSkillMatch(cSkill, wish));
      if (matched) {
        candidateTeachesLearnerMatch = { candidateSkill: matched, userWish: wish };
        break;
      }
    }

    // 2. Check if currentUser teaches something candidate wants to learn
    let userTeachesCandidateMatch: { userSkill: string; candidateWish: string } | null = null;
    for (const candidateWish of candidateWantsToLearn) {
      const matched = userTeaches.find((uSkill) => isSkillMatch(uSkill, candidateWish));
      if (matched) {
        userTeachesCandidateMatch = { userSkill: matched, candidateWish: candidateWish };
        break;
      }
    }

    // If neither direction matches, there is no skill synergy
    if (!candidateTeachesLearnerMatch && !userTeachesCandidateMatch) {
      continue;
    }

    // Determine Match Type
    let matchType: MatchType = 'one-way-learn';
    let compatibilityTier: SmartMatch['compatibilityTier'] = 'High Match';
    let baseScore = 80;
    let skillTheyTeach = '';
    let skillYouTeach: string | undefined = undefined;
    let explanation = '';

    if (candidateTeachesLearnerMatch && userTeachesCandidateMatch) {
      // MUTUAL EXCHANGE!
      matchType = 'mutual';
      compatibilityTier = 'Mutual Exchange';
      baseScore = 93;
      skillTheyTeach = candidateTeachesLearnerMatch.candidateSkill;
      skillYouTeach = userTeachesCandidateMatch.userSkill;
      explanation = `Mutual exchange: You can teach ${skillYouTeach}, and ${candidate.name} offers ${skillTheyTeach}, which is on your learning wishlist.`;
    } else if (candidateTeachesLearnerMatch) {
      // Learner wants to learn from candidate
      matchType = 'one-way-learn';
      compatibilityTier = 'High Match';
      baseScore = 82;
      skillTheyTeach = candidateTeachesLearnerMatch.candidateSkill;
      explanation = `Direct match: ${candidate.name} teaches ${skillTheyTeach}, which matches your learning wishlist.`;
    } else if (userTeachesCandidateMatch) {
      // Candidate wants to learn from learner (earning opportunity)
      matchType = 'one-way-teach';
      compatibilityTier = 'Compatible';
      baseScore = 74;
      skillTheyTeach = candidateTeaches[0] || 'Peer Mentorship';
      skillYouTeach = userTeachesCandidateMatch.userSkill;
      explanation = `Earning opportunity: ${candidate.name} is looking to learn ${skillYouTeach}, which you teach.`;
    }

    // Find active marketplace listing for the skill they teach
    const matchedListing = findBestSkillListing(candidate.id, skillTheyTeach, allSkills);

    // Calculate score bonuses
    let score = baseScore;
    if (matchedListing) score += 3;
    if ((candidate.repRating || 5.0) >= 4.9) score += 3;
    score = Math.min(score, 99);

    // Credit calculations
    const creditCost = matchedListing ? matchedListing.hourlyCredits : 2;
    const hasEnoughCredits = (currentUser.credits || 0) >= creditCost;
    const creditsNeeded = Math.max(0, creditCost - (currentUser.credits || 0));

    // Check if session or swap invitation already exists
    const existingSession = sessions.find(
      (s) =>
        s.learnerId === currentUser.id &&
        s.teacherId === candidate.id &&
        (s.status === 'pending' || s.status === 'confirmed')
    );
    const existingInvitation = invitations?.find(
      (inv) =>
        ((inv.senderId === currentUser.id && inv.recipientId === candidate.id) ||
         (inv.senderId === candidate.id && inv.recipientId === currentUser.id)) &&
        inv.status === 'pending'
    );
    const isExistingRequestPending = Boolean(existingSession || existingInvitation);

    matches.push({
      candidate,
      matchType,
      score,
      compatibilityTier,
      skillTheyTeach,
      matchedListing,
      skillYouTeach,
      creditCost,
      hasEnoughCredits,
      creditsNeeded,
      explanation,
      isExistingRequestPending,
      existingSessionStatus: existingSession?.status,
      pendingInvitationId: existingInvitation?.id,
    });
  }

  // Sort matches:
  // 1. Mutual matches first
  // 2. Higher score
  // 3. Having an active listing
  // 4. Candidate rep rating
  return matches.sort((a, b) => {
    if (a.matchType === 'mutual' && b.matchType !== 'mutual') return -1;
    if (b.matchType === 'mutual' && a.matchType !== 'mutual') return 1;
    if (b.score !== a.score) return b.score - a.score;
    if (a.matchedListing && !b.matchedListing) return -1;
    if (!a.matchedListing && b.matchedListing) return 1;
    return (b.candidate.repRating || 0) - (a.candidate.repRating || 0);
  });
}
