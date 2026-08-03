/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as model_auth from "../model/auth.js";
import type * as model_reviewCards from "../model/reviewCards.js";
import type * as model_topicRemoval from "../model/topicRemoval.js";
import type * as model_topics from "../model/topics.js";
import type * as reviewCards from "../reviewCards.js";
import type * as topics from "../topics.js";
import type * as validators_reviewCards from "../validators/reviewCards.js";
import type * as validators_reviews from "../validators/reviews.js";
import type * as validators_topics from "../validators/topics.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "model/auth": typeof model_auth;
  "model/reviewCards": typeof model_reviewCards;
  "model/topicRemoval": typeof model_topicRemoval;
  "model/topics": typeof model_topics;
  reviewCards: typeof reviewCards;
  topics: typeof topics;
  "validators/reviewCards": typeof validators_reviewCards;
  "validators/reviews": typeof validators_reviews;
  "validators/topics": typeof validators_topics;
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
