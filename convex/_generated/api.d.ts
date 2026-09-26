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
import type * as sessions_queries from "../sessions/queries.js";

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
  "sessions/queries": typeof sessions_queries;
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
