# Backend Handoff for Integration

What the Convex backend gives the frontend, and what still has to be wired up.
Everything here exists in `master` and is deployed to `dev:calm-horse-47`.
Nothing below has been tested end to end through the browser yet.

## Setup after pulling

```bash
npx convex dev                      # push functions to your own dev deployment
npx convex run seed:seedSkills      # once per new deployment: adds the 12 starter skills
```

## Errors

Backend checks throw `ConvexError`s (`ValidationError` / `AuthorizationError`),
so `getErrorMessage(err)` from `lib/utils/errors.ts` shows the real message,
e.g. `Username "ana" is already taken` or
`There is already a pending request for this match`.

## Queries when the user has no profile yet

These return an empty result instead of throwing, so they are safe to call on
any signed-in page: `getDiscoverMatches`, `getCurrentUserMatches` → `[]`,
`getMatchById` → `null`, `listMyNotifications` → `[]`, `getUnreadCount` → `0`,
`listSentRequests` / `listReceivedRequests` → `[]`, and Blaine's session queries.

`userSkills.listCurrentUserSkills` still throws without a profile. Skip it until
`users.current` returns a user, like `app/profile/page.tsx` does.

---

## Discover

| Function | Type | Args | Returns |
|---|---|---|---|
| `api.matching.mutations.generateMatchesForCurrentUser` | mutation | `{}` | ACTIVE match docs created/refreshed. Needs a profile. |
| `api.matching.queries.getDiscoverMatches` | query | `{}` | list below, highest score first |
| `api.matching.mutations.updateMatchStatus` | mutation | `{ matchId, status: "DISMISSED" }` | updated match. Only DISMISSED is allowed. |

`getDiscoverMatches` item (already fits `MatchProfileDetails`):

```ts
{
  id: Id<"matches">,       // use as matchId for sendRequest / updateMatchStatus
  partnerId: Id<"users">,
  name: string,
  username: string,
  location?: string,
  avatarUrl?: string,
  bio?: string,
  score: number,           // 0-100
  matchedSkills: string[], // skill names
  teachingSkills: string[], // what the partner can teach
  learningSkills: string[], // what the partner wants to learn
  matchReason: string,     // "Ana can teach you Guitar. You can teach Ana Spanish."
}
```

### Arthur — needed in `app/discover/page.tsx`
1. Remove `demoMatches`. Call `generateMatchesForCurrentUser` once when the page
   loads (or with a "Find matches" button), then show `useQuery(getDiscoverMatches)`.
2. Dismiss must call `updateMatchStatus({ matchId: id, status: "DISMISSED" })`.
   Right now it only filters local state, so dismissed people come back on reload.
3. Send must call `sendRequest` (see below) instead of `console.log`.

## Exchange requests

| Function | Type | Args | Returns | Who can call |
|---|---|---|---|---|
| `api.exchanges.mutations.sendRequest` | mutation | `{ matchId, message? }` | request id | either person in an ACTIVE match |
| `api.exchanges.mutations.acceptRequest` | mutation | `{ requestId }` | request id | recipient only |
| `api.exchanges.mutations.declineRequest` | mutation | `{ requestId }` | request id | recipient only |
| `api.exchanges.mutations.cancelRequest` | mutation | `{ requestId }` | request id | sender only |
| `api.exchanges.queries.listReceivedRequests` | query | `{ status? }` | requests sent to me | — |
| `api.exchanges.queries.listSentRequests` | query | `{ status? }` | requests I sent | — |

List item: the request document plus
`otherUser: { _id, name, username, avatarUrl }`, newest first.
`status` is one of `PENDING | ACCEPTED | DECLINED | CANCELLED | EXPIRED`.

Rules:
- Only `PENDING` requests can be accepted, declined or cancelled.
- One `PENDING` or `ACCEPTED` request per match, in either direction. Sending again
  shows "There is already a pending request for this match".
- After a decline or cancel, either person can send a new request.
- Accepting sets the match to `CONNECTED`. The pair then appears in Blaine's
  `getSchedulableExchanges`, so they can schedule.
- Accepting is rejected if the two people no longer share an active skill that
  one teaches and the other wants to learn. The request stays `PENDING` so it can
  be declined or cancelled.
- `EXPIRED` requests are not implemented (no scheduled jobs in the MVP).

### Arthur — request form contract
`sendRequest` only takes `{ matchId, message? }`. The current
`ExchangeRequestDraft` has `requestedSkill` and `offeredSkill`, which the backend
has no fields for. Either drop them or put them in the message text. The actual
skill is picked later on the schedule page.

### Arthur — one-way matches
The "Send Exchange Request" button is disabled when the partner teaches nothing
(`MatchProfileModal.tsx`). The backend allows a request when only *you* can teach
*them*. Decide whether to keep that restriction.

### Arthur — request inbox (required)
There is no page that shows requests yet, so nobody can accept a request and
nobody can reach scheduling. Needed:
- **Received**: `listReceivedRequests({ status: "PENDING" })` with Accept and Decline.
- **Sent**: `listSentRequests({ status: "PENDING" })` with Cancel.
- After accepting, link to `/sessions` (or `/sessions/schedule/[requestId]`).

Where it goes (own page, `/sessions` section, or dashboard) is a team decision.
`getDiscoverMatches` does not say whether a request is already pending, so after
a reload Discover can't show "request sent" by itself.

## Dashboard (no new backend needed)

| Data | Function |
|---|---|
| Current user | `api.users.queries.current` |
| My skills | `api.userSkills.queries.listCurrentUserSkills` (+ `api.skills.queries.listActive` for names) |
| Upcoming sessions | `api.sessions.queries.getUpcomingSessions` |
| Pending requests to answer | `api.exchanges.queries.listReceivedRequests({ status: "PENDING" })` |
| Unread notifications | `api.notifications.queries.getUnreadCount` |

`getUpcomingSessions` items are the session document plus
`teacher`, `learner` (`{ _id, name, username, avatarUrl }`), `skill { _id, name }`,
`viewerRole: "TEACHER" | "LEARNER"` and `needsReview`.

The dashboard page is still hardcoded today.

## Notifications

| Function | Type | Args | Returns |
|---|---|---|---|
| `api.notifications.queries.listMyNotifications` | query | `{ limit? }` (default 20, max 100) | newest first |
| `api.notifications.queries.getUnreadCount` | query | `{}` | number |
| `api.notifications.mutations.markNotificationRead` | mutation | `{ notificationId }` | id. Owner only. |
| `api.notifications.mutations.markAllNotificationsRead` | mutation | `{}` | how many were marked |

Fields: `type, title, message, read, createdAt, readAt?, relatedEntityId?, relatedEntityType?`.

| Event | Type | Sent to |
|---|---|---|
| request sent | `EXCHANGE_REQUEST` | recipient |
| request accepted | `REQUEST_ACCEPTED` | sender |
| request declined | `REQUEST_DECLINED` | sender |
| session scheduled | `SESSION_SCHEDULED` | the other participant |
| session cancelled | `SESSION_CANCELLED` | the other participant |
| review left | `REVIEW_RECEIVED` | the person reviewed |

Not sent: request cancelled, session started/completed/no-show,
`SESSION_REMINDER` (would need a scheduled job).

Links: `relatedEntityType: "learningSession"` → `/session/[relatedEntityId]`,
`"exchangeRequest"` → the request inbox.

No notification UI exists yet (Arthur).

## Matching rules to know

- Matches are only created or updated when someone calls
  `generateMatchesForCurrentUser`.
- On regenerate, an ACTIVE match that no longer lines up becomes `EXPIRED`,
  unless it has a `PENDING` request. It becomes `ACTIVE` again if the skills
  line up again.
- `DISMISSED` and `CONNECTED` matches are never changed by regenerate.
- Deactivated catalog skills don't count toward matches.
- `getDiscoverMatches` only shows `ACTIVE` matches, and hides any whose skills
  no longer line up, even before someone regenerates.

## Sessions and video (Blaine)

Already wired in the frontend: scheduling, the session lifecycle, and reviews.
Video needs `STREAM_API_SECRET` set on the Convex deployment
(`npx convex env set STREAM_API_SECRET ...`, never in a frontend file) and
`NEXT_PUBLIC_STREAM_API_KEY` in `.env.local`. Neither is set yet. That is
Blaine's setup.

## Shared end-to-end checklist

Use two Clerk test accounts (A and B) on the same deployment.

- [ ] A and B sign up and complete onboarding
- [ ] Each adds skills on the profile page (A teaches what B learns, and the other way)
- [ ] Each sets availability
- [ ] A opens Discover: matches are generated and B shows up with a reason
- [ ] A dismisses someone; they stay gone after reload
- [ ] A sends a request to B; B gets an `EXCHANGE_REQUEST` notification
- [ ] Sending again shows the "already pending" error
- [ ] B accepts in the inbox; A gets `REQUEST_ACCEPTED`; the match is CONNECTED
- [ ] One of them schedules a session; the other gets `SESSION_SCHEDULED`
- [ ] Both join the video call at the scheduled time
- [ ] One marks the session completed
- [ ] Both leave a review; each gets `REVIEW_RECEIVED`
- [ ] Notifications can be marked read; the unread count goes to 0
- [ ] Also try: decline, cancel a request, cancel a session before it starts
