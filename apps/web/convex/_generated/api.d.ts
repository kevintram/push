/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cards from "../cards.js";
import type * as collections from "../collections.js";
import type * as due from "../due.js";
import type * as migrations from "../migrations.js";
import type * as model_auth from "../model/auth.js";
import type * as model_cards from "../model/cards.js";
import type * as model_collectionRemoval from "../model/collectionRemoval.js";
import type * as model_collections from "../model/collections.js";
import type * as model_due from "../model/due.js";
import type * as model_reviews from "../model/reviews.js";
import type * as model_sectionRemoval from "../model/sectionRemoval.js";
import type * as model_sections from "../model/sections.js";
import type * as model_srs_replay from "../model/srs/replay.js";
import type * as reviews from "../reviews.js";
import type * as sections from "../sections.js";
import type * as utils_assertNonNull from "../utils/assertNonNull.js";
import type * as validators_cards from "../validators/cards.js";
import type * as validators_collections from "../validators/collections.js";
import type * as validators_due from "../validators/due.js";
import type * as validators_reviewRatings from "../validators/reviewRatings.js";
import type * as validators_reviews from "../validators/reviews.js";
import type * as validators_sections from "../validators/sections.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cards: typeof cards;
  collections: typeof collections;
  due: typeof due;
  migrations: typeof migrations;
  "model/auth": typeof model_auth;
  "model/cards": typeof model_cards;
  "model/collectionRemoval": typeof model_collectionRemoval;
  "model/collections": typeof model_collections;
  "model/due": typeof model_due;
  "model/reviews": typeof model_reviews;
  "model/sectionRemoval": typeof model_sectionRemoval;
  "model/sections": typeof model_sections;
  "model/srs/replay": typeof model_srs_replay;
  reviews: typeof reviews;
  sections: typeof sections;
  "utils/assertNonNull": typeof utils_assertNonNull;
  "validators/cards": typeof validators_cards;
  "validators/collections": typeof validators_collections;
  "validators/due": typeof validators_due;
  "validators/reviewRatings": typeof validators_reviewRatings;
  "validators/reviews": typeof validators_reviews;
  "validators/sections": typeof validators_sections;
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
