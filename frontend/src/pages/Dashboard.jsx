import ReadinessDashboard from "../components/ReadinessDashboard";

// ── Map live profile + API scores → ReadinessDashboard shape ──────────────
// Essay API returns:  { scores: { clarity_of_story, authenticity, school_fit, originality, overall (1-10) }, strengths[], weaknesses[], paragraph_suggestions[] }
// Interview API returns: { overall_score (1-100), dimension_scores: { self_introduction, motivation_clarity, communication, authenticity, school_fit, resilience_grit (1-10) }, top_moments[], weak_moments[], improvement_tips[] }
// Profile API (scoreResult) returns: { overall_score, breakdown: { GPA, SAT, IELTS, Extracurricular, Essay }, tier, estimated_probability }

function scale(val, fromMax, toMax) {
  return Math.round((val / fromMax) * toMax);
}

function buildReadinessResult(profile, essayScore, interviewScore) {
  const gpa = parseFloat(profile.gpa) || 0;
  const sat = parseFloat(profile.sat) || 0;
  const ielts = parseFloat(profile.ielts) || 0;

  // Hard Factors — same thang diem nhu doc trong UniMatchAI_ProjectDoc.pdf
  const gpaPoints = gpa >= 3.9 ? 15 : gpa >= 3.7 ? 10 : gpa >= 3.5 ? 5 : 2;
  const satPoints = sat >= 1550 ? 10 : sat >= 1510 ? 7 : sat >= 1450 ? 4 : 1;
  const ieltsPoints =
    ielts >= 7.5 ? 10 : ielts >= 7.0 ? 7 : ielts >= 6.5 ? 4 : 1;
  const hardTotal = gpaPoints + satPoints + ieltsPoints;

  // Extracurricular — from activity_categories selected in ProfileBar
  const cats = profile.activity_categories || [];
  const ecScore = Math.min(
    20,
    cats.length >= 1 ? 8 + (cats.length - 1) * 4 : 0,
  );

  // Essay — map actual API fields to our 5 criteria (scale 1-10 → 0-5)
  const es = essayScore?.scores || {};
  const essayCriteria = [
    {
      label: "Authentic Voice",
      score: es.authenticity ? scale(es.authenticity, 10, 5) : 0,
      max: 5,
    },
    {
      label: "Depth & Specificity",
      score: es.clarity_of_story ? scale(es.clarity_of_story, 10, 5) : 0,
      max: 5,
    },
    {
      label: "School Fit",
      score: es.school_fit ? scale(es.school_fit, 10, 5) : 0,
      max: 5,
    },
    {
      label: "Structure & Flow",
      score: es.overall ? scale(es.overall, 10, 5) : 0,
      max: 5,
    },
    {
      label: "Hook & Originality",
      score: es.originality ? scale(es.originality, 10, 5) : 0,
      max: 5,
    },
  ];
  const essayTotal = essayScore ? Math.round(((es.overall || 0) / 10) * 25) : 0;

  // Interview — map actual API fields to our 4 criteria (scale 1-10 → 0-5)
  const ds = interviewScore?.dimension_scores || {};
  const ivCriteria = [
    {
      label: "Clear Communication",
      score: ds.communication ? scale(ds.communication, 10, 5) : 0,
      max: 5,
    },
    {
      label: "Intellectual Curiosity",
      score: ds.motivation_clarity ? scale(ds.motivation_clarity, 10, 5) : 0,
      max: 5,
    },
    {
      label: "Personal Authenticity",
      score: ds.authenticity ? scale(ds.authenticity, 10, 5) : 0,
      max: 5,
    },
    {
      label: "School Fit",
      score: ds.school_fit ? scale(ds.school_fit, 10, 5) : 0,
      max: 5,
    },
  ];
  const ivTotal = interviewScore
    ? Math.round(((interviewScore.overall_score || 0) / 100) * 20)
    : 0;

  // Essay feedback — strengths from API, improvements from paragraph_suggestions
  const essayStrengths = essayScore?.strengths?.length
    ? essayScore.strengths.slice(0, 3)
    : ["Complete the Essay tab to see detailed feedback."];

  const essayImprovements = essayScore?.paragraph_suggestions?.length
    ? essayScore.paragraph_suggestions.map((s, i) => ({
        priority: i === 0 ? "high" : i === 1 ? "high" : "medium",
        title: s.issue || "Improvement needed",
        body: s.suggestion || "",
      }))
    : essayScore?.weaknesses?.length
      ? essayScore.weaknesses.map((w, i) => ({
          priority: i === 0 ? "high" : "medium",
          title: w.length > 60 ? w.slice(0, 57) + "..." : w,
          body: w,
        }))
      : [
          {
            priority: "medium",
            title: "Complete the Essay tab",
            body: "Submit an essay to receive detailed feedback here.",
          },
        ];

  // Interview feedback — strengths from top_moments, improvements from improvement_tips + weak_moments
  const ivStrengths = interviewScore?.top_moments?.length
    ? interviewScore.top_moments.slice(0, 2)
    : ["Complete the Interview tab to see detailed feedback."];

  const ivImprovements = interviewScore?.improvement_tips?.length
    ? interviewScore.improvement_tips.map((tip, i) => ({
        priority: i === 0 ? "high" : i === 1 ? "medium" : "low",
        title: tip.length > 60 ? tip.slice(0, 57) + "..." : tip,
        body: tip,
      }))
    : [
        {
          priority: "medium",
          title: "Complete the Interview tab",
          body: "Finish a mock interview to receive detailed feedback here.",
        },
      ];

  const total = Math.min(100, hardTotal + ecScore + essayTotal + ivTotal);

  return {
    student: {
      name: profile.name || "Student",
      targetSchool: profile.school_name || "MIT",
      applyYear: new Date().getFullYear() + 1,
    },
    scores: {
      total,
      hardFactors: {
        score: hardTotal,
        max: 35,
        gpa: { val: gpa, pts: gpaPoints },
        sat: { val: sat, pts: satPoints },
        ielts: { val: ielts, pts: ieltsPoints },
      },
      extracurricular: {
        score: ecScore,
        max: 20,
        activities: cats.map((c, i) => ({
          name: c,
          tier: i === 0 ? 1 : i === 1 ? 2 : 3,
        })),
      },
      essay: { score: essayTotal, max: 25, criteria: essayCriteria },
      interview: { score: ivTotal, max: 20, criteria: ivCriteria },
    },
    essayFeedback: {
      strengths: essayStrengths,
      improvements: essayImprovements,
    },
    interviewFeedback: { strengths: ivStrengths, improvements: ivImprovements },
  };
}

export default function Dashboard({ profile, essayScore, interviewScore }) {
  return (
    <section>
      <ReadinessDashboard
        result={buildReadinessResult(profile, essayScore, interviewScore)}
      />
    </section>
  );
}
