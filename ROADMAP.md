# FilmForge — Recommendation Engine Roadmap

## Concept
A smart movie discovery and recommendation app that suggests films based on mood, similarity, and natural language input.

## Recommendation Modes

### 1. Mood-Based
- User picks a vibe: Chill, Intense, Funny, Sad, Romantic, Thrilling, Inspiring
- Each mood maps to a set of genres + TMDB sort parameters
- UI: large mood selector cards with visual themes

### 2. "Because You Liked X"
- User searches/selects a movie they liked
- App fetches TMDB `/movie/{id}/similar` and `/movie/{id}/recommendations`
- Displays ranked results with match indicators

### 3. AI-Powered (Plain Text)
- User describes what they want: "something like Interstellar but funnier"
- AI (Claude via OpenRouter free tier) interprets the prompt
- AI returns genre tags, keywords, tone descriptors
- App queries TMDB with those parameters

### 4. Hybrid Feed
- Combines all three signals: mood + liked movies + AI prompt
- Weighted scoring to surface the best matches
- "Why recommended" label on each card

## Pages / Sections
- `/` — Hero + mood selector + trending
- `/discover` — Full recommendation feed
- `/similar/:movieId` — Because you liked X
- `/ai` — Plain text AI search

## Tech To Add
- Backend: Node/Express or keep serverless (Appwrite functions)
- AI: Claude via OpenRouter (already have API key)
- Keep: TMDB API, Appwrite for trending/user data

## Current State
- TMDB browsing by genre
- Search with trending tracking via Appwrite
- No recommendation logic yet
