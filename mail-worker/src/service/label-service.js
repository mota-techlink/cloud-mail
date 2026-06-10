import orm from '../entity/orm';
import { label } from '../entity/label';
import { emailLabel } from '../entity/email-label';
import email from '../entity/email';
import { and, asc, desc, eq, inArray, lt } from 'drizzle-orm';
import BizError from '../error/biz-error';
import { archivedConst, isDel } from '../const/entity-const';
import attService from './att-service';
import { t } from '../i18n/i18n';

const labelService = {

	async add(c, params, userId) {
		const { name, color, parentId } = params;
		if (!name || !name.trim()) {
			throw new BizError(t('labelNameRequired') || 'label name required');
		}
		const values = {
			userId,
			name: name.trim(),
			color: color || '#1890ff',
			parentId: Number(parentId) || 0
		};
		const row = await orm(c).insert(label).values(values).returning().get();
		return row;
	},

	async update(c, params, userId) {
		const { labelId, name, color, parentId } = params;
		const exist = await orm(c).select().from(label)
			.where(and(eq(label.labelId, Number(labelId)), eq(label.userId, userId))).get();
		if (!exist) {
			throw new BizError(t('labelNotExist') || 'label not exist');
		}
		const set = {};
		if (name !== undefined && name !== null) set.name = String(name).trim();
		if (color !== undefined && color !== null) set.color = color;
		if (parentId !== undefined && parentId !== null) {
			const pid = Number(parentId) || 0;
			if (pid === Number(labelId)) {
				throw new BizError('parent invalid');
			}
			set.parentId = pid;
		}
		await orm(c).update(label).set(set)
			.where(and(eq(label.labelId, Number(labelId)), eq(label.userId, userId))).run();
	},

	async delete(c, params, userId) {
		const labelId = Number(params.labelId);
		const target = await orm(c).select().from(label)
			.where(and(eq(label.userId, userId), eq(label.labelId, labelId))).get();
		if (!target) return;
		const newParent = target.parentId || 0;
		await orm(c).update(label).set({ parentId: newParent })
			.where(and(eq(label.userId, userId), eq(label.parentId, labelId))).run();
		await orm(c).delete(emailLabel)
			.where(and(eq(emailLabel.userId, userId), eq(emailLabel.labelId, labelId))).run();
		await orm(c).delete(label)
			.where(and(eq(label.userId, userId), eq(label.labelId, labelId))).run();
	},

	async list(c, userId) {
		const rows = await orm(c).select().from(label)
			.where(eq(label.userId, userId))
			.orderBy(asc(label.labelId)).all();

		const map = new Map();
		rows.forEach(r => {
			r.parentId = r.parentId || 0;
			r.children = [];
			map.set(r.labelId, r);
		});
		const tree = [];
		rows.forEach(r => {
			const parent = r.parentId && map.get(r.parentId);
			if (parent) {
				parent.children.push(r);
			} else {
				tree.push(r);
			}
		});
		return tree;
	},

	async attach(c, params, userId) {
		const emailId = Number(params.emailId);
		const labelIds = Array.isArray(params.labelIds) ? params.labelIds.map(Number) : [];

		const emailRow = await orm(c).select().from(email).where(eq(email.emailId, emailId)).get();
		if (!emailRow || emailRow.userId !== userId) {
			throw new BizError(t('emailNotExist') || 'email not exist');
		}

		if (labelIds.length > 0) {
			const valid = await orm(c).select({ labelId: label.labelId }).from(label)
				.where(and(eq(label.userId, userId), inArray(label.labelId, labelIds))).all();
			const validIds = valid.map(r => r.labelId);
			await orm(c).delete(emailLabel)
				.where(and(eq(emailLabel.userId, userId), eq(emailLabel.emailId, emailId))).run();
			if (validIds.length > 0) {
				const values = validIds.map(lid => ({ userId, emailId, labelId: lid }));
				await orm(c).insert(emailLabel).values(values).run();
			}
		} else {
			await orm(c).delete(emailLabel)
				.where(and(eq(emailLabel.userId, userId), eq(emailLabel.emailId, emailId))).run();
		}
	},

	async batchAttach(c, params, userId) {
		const emailIds = Array.isArray(params.emailIds) ? params.emailIds.map(Number).filter(Boolean) : [];
		const labelIds = Array.isArray(params.labelIds) ? params.labelIds.map(Number).filter(Boolean) : [];
		if (emailIds.length === 0 || labelIds.length === 0) return;

		const ownedEmails = await orm(c).select({ emailId: email.emailId }).from(email)
			.where(and(eq(email.userId, userId), inArray(email.emailId, emailIds))).all();
		const validEmailIds = ownedEmails.map(r => r.emailId);
		if (validEmailIds.length === 0) return;

		const ownedLabels = await orm(c).select({ labelId: label.labelId }).from(label)
			.where(and(eq(label.userId, userId), inArray(label.labelId, labelIds))).all();
		const validLabelIds = ownedLabels.map(r => r.labelId);
		if (validLabelIds.length === 0) return;

		const existing = await orm(c).select({
			emailId: emailLabel.emailId,
			labelId: emailLabel.labelId
		}).from(emailLabel)
			.where(and(
				eq(emailLabel.userId, userId),
				inArray(emailLabel.emailId, validEmailIds),
				inArray(emailLabel.labelId, validLabelIds)
			)).all();
		const existSet = new Set(existing.map(r => `${r.emailId}:${r.labelId}`));

		const values = [];
		validEmailIds.forEach(eid => {
			validLabelIds.forEach(lid => {
				if (!existSet.has(`${eid}:${lid}`)) {
					values.push({ userId, emailId: eid, labelId: lid });
				}
			});
		});
		if (values.length > 0) {
			await orm(c).insert(emailLabel).values(values).run();
		}
	},

	async emailList(c, params, userId) {
		let { labelId, emailId, size } = params;
		labelId = Number(labelId);
		emailId = Number(emailId);
		size = Number(size);
		if (!emailId) emailId = 9999999999;
		if (!size || size > 50) size = 50;

		const list = await orm(c).select({
			...email,
			elId: emailLabel.id
		}).from(emailLabel)
			.leftJoin(email, eq(email.emailId, emailLabel.emailId))
			.where(and(
				eq(emailLabel.userId, userId),
				eq(emailLabel.labelId, labelId),
				eq(email.isDel, isDel.NORMAL),
				lt(emailLabel.emailId, emailId)
			))
			.orderBy(desc(emailLabel.emailId))
			.limit(size).all();

		const emailIds = list.map(item => item.emailId);
		if (emailIds.length > 0) {
			const attsList = await attService.selectByEmailIds(c, emailIds);
			const labelMap = await this.selectLabelsByEmailIds(c, emailIds, userId);
			list.forEach(row => {
				row.attList = attsList.filter(a => a.emailId === row.emailId);
				row.labels = labelMap[row.emailId] || [];
			});
		}

		return { list };
	},

	async selectLabelsByEmailIds(c, emailIds, userId) {
		if (!emailIds || emailIds.length === 0) return {};
		const conds = [inArray(emailLabel.emailId, emailIds)];
		if (userId !== undefined && userId !== null) {
			conds.unshift(eq(emailLabel.userId, userId));
		}
		const rows = await orm(c).select({
			emailId: emailLabel.emailId,
			labelId: label.labelId,
			name: label.name,
			color: label.color
		}).from(emailLabel)
			.leftJoin(label, eq(label.labelId, emailLabel.labelId))
			.where(and(...conds)).all();
		const map = {};
		rows.forEach(r => {
			if (!r.labelId) return;
			if (!map[r.emailId]) map[r.emailId] = [];
			map[r.emailId].push({ labelId: r.labelId, name: r.name, color: r.color });
		});
		return map;
	},

	async attachLabelsToList(c, list, userId) {
		if (!list || list.length === 0) return;
		const emailIds = list.map(item => item.emailId);
		const map = await this.selectLabelsByEmailIds(c, emailIds, userId);
		list.forEach(row => {
			row.labels = map[row.emailId] || [];
		});
	},

	async removeByEmailIds(c, emailIds) {
		if (!emailIds || emailIds.length === 0) return;
		await orm(c).delete(emailLabel).where(inArray(emailLabel.emailId, emailIds)).run();
	}
};

export default labelService;
