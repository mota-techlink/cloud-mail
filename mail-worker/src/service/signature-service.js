import orm from '../entity/orm';
import { signature } from '../entity/signature';
import { and, asc, eq, or } from 'drizzle-orm';
import BizError from '../error/biz-error';
import { t } from '../i18n/i18n';

function isAdminUser(c, user) {
	return user && user.email && c.env.admin === user.email;
}

const signatureService = {

	async list(c, user) {
		const userId = user.userId;
		const rows = await orm(c).select().from(signature)
			.where(or(eq(signature.userId, userId), eq(signature.isCompany, 1)))
			.orderBy(asc(signature.isCompany), asc(signature.sigId)).all();
		return rows.map(r => ({
			...r,
			editable: r.isCompany ? isAdminUser(c, user) : r.userId === userId
		}));
	},

	async add(c, params, user) {
		const userId = user.userId;
		const name = String(params.name || '').trim();
		const content = String(params.content || '');
		if (!name) throw new BizError(t('signatureNameRequired') || 'name required');
		const isDefault = params.isDefault ? 1 : 0;
		if (isDefault) {
			await orm(c).update(signature).set({ isDefault: 0 })
				.where(and(eq(signature.userId, userId), eq(signature.isCompany, 0))).run();
		}
		const row = await orm(c).insert(signature).values({
			userId, name, content, isDefault, isCompany: 0
		}).returning().get();
		return row;
	},

	async update(c, params, user) {
		const id = Number(params.sigId);
		if (!id) throw new BizError('id required');
		const exist = await orm(c).select().from(signature).where(eq(signature.sigId, id)).get();
		if (!exist) throw new BizError(t('signatureNotExist') || 'not exist');

		if (exist.isCompany) {
			if (!isAdminUser(c, user)) throw new BizError(t('unauthorized'), 403);
		} else if (exist.userId !== user.userId) {
			throw new BizError(t('unauthorized'), 403);
		}

		const set = {};
		if (params.name !== undefined) {
			const name = String(params.name).trim();
			if (!name) throw new BizError(t('signatureNameRequired') || 'name required');
			set.name = name;
		}
		if (params.content !== undefined) set.content = String(params.content);
		if (params.isDefault !== undefined && !exist.isCompany) {
			set.isDefault = params.isDefault ? 1 : 0;
			if (set.isDefault) {
				await orm(c).update(signature).set({ isDefault: 0 })
					.where(and(eq(signature.userId, exist.userId), eq(signature.isCompany, 0))).run();
			}
		}
		if (Object.keys(set).length === 0) return;
		await orm(c).update(signature).set(set).where(eq(signature.sigId, id)).run();
	},

	async delete(c, params, user) {
		const id = Number(params.sigId);
		if (!id) return;
		const exist = await orm(c).select().from(signature).where(eq(signature.sigId, id)).get();
		if (!exist) return;
		if (exist.isCompany) {
			if (!isAdminUser(c, user)) throw new BizError(t('unauthorized'), 403);
		} else if (exist.userId !== user.userId) {
			throw new BizError(t('unauthorized'), 403);
		}
		await orm(c).delete(signature).where(eq(signature.sigId, id)).run();
	},

	async addCompany(c, params, user) {
		if (!isAdminUser(c, user)) throw new BizError(t('unauthorized'), 403);
		const name = String(params.name || '').trim();
		const content = String(params.content || '');
		if (!name) throw new BizError(t('signatureNameRequired') || 'name required');
		const row = await orm(c).insert(signature).values({
			userId: 0, name, content, isDefault: 0, isCompany: 1
		}).returning().get();
		return row;
	},

	async setDefault(c, params, user) {
		const id = Number(params.sigId);
		const userId = user.userId;
		await orm(c).update(signature).set({ isDefault: 0 })
			.where(and(eq(signature.userId, userId), eq(signature.isCompany, 0))).run();
		if (!id) return;
		const exist = await orm(c).select().from(signature).where(eq(signature.sigId, id)).get();
		if (!exist || exist.isCompany || exist.userId !== userId) return;
		await orm(c).update(signature).set({ isDefault: 1 }).where(eq(signature.sigId, id)).run();
	}
};

export default signatureService;
