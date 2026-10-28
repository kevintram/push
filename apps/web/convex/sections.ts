import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireIdentity } from './model/auth'
import * as SectionConversion from './model/sectionConversion'
import * as SectionRemoval from './model/sectionRemoval'
import * as Sections from './model/sections'
import {
	sectionCreate,
	sectionMove,
	sectionPatch,
	sectionRead,
} from './validators/sections'

export const listByCollection = query({
	args: {
		collectionId: v.id('collections'),
	},
	returns: v.array(sectionRead),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Sections.listByCollection(ctx, userId, args.collectionId)
	},
})

export const create = mutation({
	args: sectionCreate.fields,
	returns: v.id('sections'),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await Sections.create(ctx, userId, args)
	},
})

export const update = mutation({
	args: {
		sectionId: v.id('sections'),
		...sectionPatch.fields,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)
		const { sectionId, ...patch } = args

		await Sections.update(ctx, userId, sectionId, patch)
	},
})

export const move = mutation({
	args: {
		sectionId: v.id('sections'),
		...sectionMove.fields,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		await Sections.move(ctx, userId, args.sectionId, args.afterId)
	},
})

export const convertToCollection = mutation({
	args: {
		sectionId: v.id('sections'),
	},
	returns: v.id('collections'),
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await SectionConversion.convertToCollection(
			ctx,
			userId,
			args.sectionId,
		)
	},
})

/* AKA delete (we don't use `delete` because it's a reserved JS keyword) */
export const remove = mutation({
	args: {
		sectionId: v.id('sections'),
	},
	returns: sectionRead,
	handler: async (ctx, args) => {
		const { subject: userId } = await requireIdentity(ctx)

		return await SectionRemoval.remove(ctx, userId, args.sectionId)
	},
})
