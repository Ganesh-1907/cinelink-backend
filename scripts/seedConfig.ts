/**
 * CineLink Firestore Config Seed Script
 *
 * Run this once to populate Firestore with config documents
 * that replace hardcoded content.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seedConfig.ts
 */
import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccount = require(path.resolve(__dirname, '../../service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

async function seed() {
  const config = db.collection('config');

  // ── Industry Guide ──
  await config.doc('industryGuide').set({
    Actor: [
      { title: 'Build a Strong Portfolio', tip: 'Upload at least 5 professional photos and a showreel video.' },
      { title: 'Network with Directors', tip: 'Follow and connect with casting directors in your region.' },
      { title: 'Stay Available', tip: 'Keep your availability status updated to get more audition calls.' },
      { title: 'Practice Monologues', tip: 'Prepare 2-3 monologues in different genres for auditions.' },
      { title: 'Get Verified', tip: 'Apply for verification to stand out as a genuine professional.' },
    ],
    Director: [
      { title: 'Post Clear Auditions', tip: 'Include role details, age range, language, and deadline.' },
      { title: 'Review Applications Thoroughly', tip: 'Check portfolios and previous work before shortlisting.' },
      { title: 'Build Your Team', tip: 'Use Crew Marketplace to find writers, DOPs, and editors.' },
      { title: 'Showcase Your Work', tip: 'Upload short films and projects to attract talent.' },
      { title: 'Get Director Approval', tip: 'Apply for director verification to post auditions.' },
    ],
    Writer: [
      { title: 'Showcase Your Scripts', tip: 'Upload samples of your best work in your portfolio.' },
      { title: 'Collaborate with Directors', tip: 'Reach out to directors looking for writers.' },
      { title: 'Enter Contests', tip: 'Competitions can get your work noticed by industry professionals.' },
      { title: 'Build Credit', tip: 'Start with short films and web series to build your writing credits.' },
    ],
    Crew: [
      { title: 'Highlight Your Skills', tip: 'List all technical skills and past projects in your profile.' },
      { title: 'Network Actively', tip: 'Connect with production houses and filmmakers.' },
      { title: 'Stay Updated', tip: 'Follow industry trends and new equipment/software.' },
    ],
    Producer: [
      { title: 'Find Talent', tip: 'Use CineLink to discover actors, directors, and crew for your projects.' },
      { title: 'Manage Budgets', tip: 'Review contest entries to find cost-effective talent.' },
      { title: 'Promote Your Projects', tip: 'Use the platform to build buzz around upcoming productions.' },
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ── Onboarding ──
  await config.doc('onboarding').set({
    slides: [
      { title: 'Welcome to CineLink', description: "India's Cinema Network — connect with film professionals across the country.", image: '🎬', order: 0 },
      { title: 'Find Auditions', description: 'Browse thousands of auditions and apply directly to casting calls.', image: '🎭', order: 1 },
      { title: 'Build Your Network', description: 'Connect with directors, producers, and fellow artists.', image: '🤝', order: 2 },
      { title: 'Showcase Your Talent', description: 'Upload your portfolio, reels, and films for the industry to see.', image: '⭐', order: 3 },
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ── Premium Plans ──
  await config.doc('premiumPlans').set({
    plans: [
      { tier: 'spotlight', name: 'Spotlight', price: 299, durationMonths: 1, features: ['Verified badge', 'Priority support', 'Extended profile'], planId: 'plan_T79TclEwk342h5' },
      { tier: 'marquee', name: 'Marquee', price: 699, durationMonths: 3, features: ['All Spotlight features', 'Analytics dashboard', 'Featured profile'], planId: 'plan_T79YHTe84YkAZt' },
      { tier: 'premiere', name: 'Premiere', price: 1299, durationMonths: 6, features: ['All Marquee features', 'Top placement in search', 'Unlimited applications'], planId: 'plan_T79Yu7hDIJWKKO' },
      { tier: 'premiereElite', name: 'Premiere Elite', price: 2499, durationMonths: 12, features: ['All Premiere features', 'Exclusive badge', 'Direct mentor access'], planId: 'plan_T79Zlz9XoAR9lt' },
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ── Rate Limits ──
  await config.doc('rateLimits').set({
    auditionsPerDay: 3,
    filmsPerDay: 2,
    contestsPerDay: 2,
    commentsPerDay: 30,
    messagesPerMinute: 30,
    cooldownMinutes: 1,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ── Categories ──
  await config.doc('categories').set({
    auditionCategories: ['Movies', 'Short Films', 'Theatre', 'YouTube / Web', 'TV / OTT'],
    roleTags: ['Lead', 'Supporting', 'Character', 'Theatre', 'Film', 'OTT', 'Web Series', 'Ad Film'],
    filterTags: ['All', 'Actor', 'Director', 'Writer', 'Mumbai', 'Delhi', 'Bollywood'],
    roles: ['Hero', 'Heroine', 'Villain', 'Supporting', 'Child Artist', 'Comedian', 'Any Role'],
    filmGenres: ['Drama', 'Action', 'Romance', 'Comedy', 'Thriller', 'Sci-Fi', 'Horror', 'Documentary'],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ── Report Reasons ──
  await config.doc('reportReasons').set({
    reasons: [
      { label: 'Fake / Scam', icon: '🚫' },
      { label: 'Inappropriate', icon: '⚠️' },
      { label: 'Spam', icon: '📧' },
      { label: 'Harassment', icon: '🚨' },
      { label: 'Misleading', icon: '❌' },
      { label: 'Other', icon: '📝' },
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Config seeded successfully!');
  process.exit(0);
}

seed().catch(e => { console.error('Seed failed:', e); process.exit(1); });
