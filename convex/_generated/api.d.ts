/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as availability_mutations from "../availability/mutations.js";
import type * as availability_queries from "../availability/queries.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as lib_validation from "../lib/validation.js";
import type * as matching_mutations from "../matching/mutations.js";
import type * as matching_queries from "../matching/queries.js";
import type * as notifications_helpers from "../notifications/helpers.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as sessions_helpers from "../sessions/helpers.js";
import type * as sessions_mutations from "../sessions/mutations.js";
import type * as sessions_queries from "../sessions/queries.js";
import type * as skills_mutations from "../skills/mutations.js";
import type * as skills_queries from "../skills/queries.js";
import type * as userSkills_mutations from "../userSkills/mutations.js";
import type * as userSkills_queries from "../userSkills/queries.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "availability/mutations": typeof availability_mutations;
  "availability/queries": typeof availability_queries;
  "lib/auth": typeof lib_auth;
  "lib/authorization": typeof lib_authorization;
  "lib/validation": typeof lib_validation;
  "matching/mutations": typeof matching_mutations;
  "matching/queries": typeof matching_queries;
  "notifications/helpers": typeof notifications_helpers;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "sessions/helpers": typeof sessions_helpers;
  "sessions/mutations": typeof sessions_mutations;
  "sessions/queries": typeof sessions_queries;
  "skills/mutations": typeof skills_mutations;
  "skills/queries": typeof skills_queries;
  "userSkills/mutations": typeof userSkills_mutations;
  "userSkills/queries": typeof userSkills_queries;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
