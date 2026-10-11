# SkillMatch Backend Handoff

## 1. Project Overview

SkillMatch helps people trade skills. A user lists skills they can teach and
skills they want to learn. The app finds other users who are a good fit, they
send each other exchange requests, and then they schedule a live video session.

The backend runs on **Convex** (our database and server functions) and uses
**Clerk** for sign-in. The frontend calls Convex functions to read and save data.

## 2. What I Completed

- **User profiles:** onboarding creates the user's profile, and the profile page
  shows real data. A user can't create two profiles or take a username that's
  already in use.
- **Skills:** a shared list of 12 starter skills. Users add skills they can
  *teach* or want to *learn*, and they can only change their own.
- **Matching:** finds users whose skills complement each other. For example, I
  teach Spanish and you want to learn it. Each match gets a score from 0 to 100,
  and a match that works both ways scores higher.
- **Exchange requests:** a user sends a request to a match. The other person can
  accept or decline, and the sender can cancel. Accepting is what allows the two
  users to schedule a session.
- **Notifications:** users get a notification when someone sends, accepts, or
  declines a request, schedules or cancels a session, or leaves a review. Users
  only see their own notifications.
- **Authentication and validation:** every function checks who is signed in and
  what they are allowed to change. For example, only the person who received a
  request can accept it.

**Final fixes (Blocks 1–4):**
- **Block 1:** published the Discover query and the stale-match handling.
  When a user's skills change and a match no longer makes sense, the match is
  marked `EXPIRED` the next time matches are generated.
- **Block 2:** error messages are now readable in the app. For example,
  "Username is already taken" instead of "Something went wrong."
- **Block 3:** a request can only be accepted if the two users still share a
  skill. Otherwise they would be connected with nothing to schedule.
- **Block 4:** skills that were turned off in the catalog no longer count
  toward matches.

## 3. How the Frontend Uses the Backend

All functions are called with Convex's `useQuery` (read data) and `useMutation`
(save data). Errors can be shown with `getErrorMessage(err)` from
`lib/utils/errors.ts`.

- **Show matches (Discover):** first call
  `api.matching.mutations.generateMatchesForCurrentUser`, then show
  `api.matching.queries.getDiscoverMatches`. Each match already includes the
  person's name, skills, score, and a short reason, such as
  *"Ana can teach you Guitar. You can teach Ana Spanish."*
- **Dismiss a match:** `updateMatchStatus({ matchId, status: "DISMISSED" })`.
- **Send a request:** `api.exchanges.mutations.sendRequest({ matchId, message })`.
  The message is optional.
- **Accept, decline, or cancel:** `acceptRequest`, `declineRequest`, or
  `cancelRequest`, each with `{ requestId }`.
- **Show requests:** `listReceivedRequests({ status: "PENDING" })` for requests
  waiting for an answer, and `listSentRequests` for requests the user sent.
- **Show notifications:** `api.notifications.queries.listMyNotifications` for the
  list and `getUnreadCount` for the badge. Mark them read with
  `markNotificationRead({ notificationId })` or `markAllNotificationsRead()`.
- **Dashboard:** no new backend is needed. Use `users.queries.current`,
  `userSkills.queries.listCurrentUserSkills`, `sessions.queries.getUpcomingSessions`,
  and `getUnreadCount`.

If the user hasn't finished onboarding, most of these queries return an empty
result instead of an error. The exception is `listCurrentUserSkills`, which
should only be called after `users.queries.current` returns a user.

## 4. What the Team Still Needs to Do

**Arthur (frontend):**
- Connect Discover to the real backend. It still uses demo data.
- Save dismissals with `updateMatchStatus`. Right now dismissed people come back
  after a page reload.
- Send requests with `sendRequest({ matchId, message })`. The backend does not
  accept the form's `requestedSkill` and `offeredSkill` fields, so remove them or
  put that text in the message.
- Decide about one-way matches. The "Send Exchange Request" button is disabled
  when the other person teaches nothing, but the backend allows a request when
  only *you* can teach *them*.
- **Build a request inbox** where users can accept, decline, or cancel requests.
  This is required: without it, nobody can reach the scheduling step.
- Connect the dashboard and add a notifications view. Both are still missing or
  use placeholder data.

**Blaine (sessions and video):**
- Set up Stream. The video secret must be set on Convex with
  `npx convex env set STREAM_API_SECRET ...`. Adding it to `.env.local` is not
  enough. `NEXT_PUBLIC_STREAM_API_KEY` must also be added to `.env.local`.
- Test joining a video call.

**Together:**
- Decide where the request inbox goes: its own page, the Sessions page, or the
  dashboard.
- Run the full end-to-end test below in the browser. Nothing has been tested end
  to end in the browser yet.

**Known limits:**
- Requests never expire on their own, and session reminders are not sent. Both
  would need scheduled background jobs.
- Discover can't tell whether a request was already sent, so after a reload the
  button shows again. Sending twice returns an "already pending" error.

## 5. How to Run and Test

1. Pull the latest `master` and install packages with `npm install`.
2. Push the backend functions to your own Convex dev deployment:
   `npx convex dev`
3. On a new deployment, add the starter skills once:
   `npx convex run seed:seedSkills`
4. Start the app in a second terminal: `npm run dev`
5. Before pushing changes, check for errors: `npx tsc --noEmit` and `npx eslint .`

## 6. Final Integration Checklist

Use two test accounts (User A and User B):

- [ ] Both users sign up and complete onboarding
- [ ] Both add skills on the profile page (A teaches what B wants to learn, and the other way around)
- [ ] Both set their availability
- [ ] A opens Discover and sees B as a match with a reason
- [ ] A dismisses another match, and it stays gone after a reload
- [ ] A sends a request to B, and B gets a notification
- [ ] B accepts the request, and A gets a notification
- [ ] One of them schedules a session, and the other gets a notification
- [ ] Both join the video call
- [ ] The session is marked completed, and both leave a review
- [ ] Notifications can be marked as read
- [ ] Also try declining a request, cancelling a request, and cancelling a session
