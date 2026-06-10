import orm from '../entity/orm';
import { filterRule } from '../entity/filter-rule';
import { emailLabel } from '../entity/email-label';
import { label } from '../entity/label';
import { and, asc, eq, inArray } from 'drizzle-orm';
import BizError from '../error/biz-error';
import { t } from '../i18n/i18n';

const VALID_FIELDS = new Set(['from', 'to', 'subject', 'content']);
const VALID_OPERATORS = new Set(['contains', 'equals', 'startsWith', 'endsWith', 'regex']);
const VALID_ACTIONS = new Set(['label', 'archive']);

function normalize(params, partial = false) {
	const out = {};
	if (!partial || params.name !== undefined) {
		if (!params.name || !String(params.name).trim()) {
			throw new BizError(t('filterNameRequired') || 'filter name required');
		}
		out.name = String(params.name).trim();
	}
	if (!partial || params.field !== undefined) {
		if (!VALID_FIELDS.has(params.field)) {
			throw new BizError(t('filterFieldInvalid') || 'invalid field');
		}
		out.field = params.field;
	}
	if (!partial || params.operator !== undefined) {
		if (!VALID_OPERATORS.has(params.operator)) {
			throw new BizError(t('filterOperatorInvalid') || 'invalid operator');
		}
		out.operator = params.operator;
	}
	if (!partial || params.value !== undefined) {
		if (params.value === undefined || params.value === null || String(params.value).length === 0) {
			throw new BizError(t('filterValueRequired') || 'value required');
		}
		out.value = String(params.value);
	}
	if (!partial || params.actionType !== undefined) {
		const types = String(params.actionType).split(',').filter(Boolean);
		if (!types.length || !types.every(t => VALID_ACTIONS.has(t))) {
			throw new BizError(t('filterActionInvalid') || 'invalid action');
		}
		out.actionType = types.join(',');
	}
	if (!partial || params.actionValue !== undefined) {
		out.actionValue = params.actionValue == null ? '' : String(params.actionValue);
	}
	if (!partial || params.enabled !== undefined) {
		out.enabled = params.enabled ? 1 : 0;
	}
	return out;
}

function matches(rule, ctx) {
	const target = (ctx[rule.field] || '').toString();
	const needle = rule.value || '';
	switch (rule.operator) {
		case 'contains':
			return target.toLowerCase().includes(needle.toLowerCase());
		case 'equals':
			return target.toLowerCase() === needle.toLowerCase();
		case 'startsWith':
			return target.toLowerCase().startsWith(needle.toLowerCase());
		case 'endsWith':
			return target.toLowerCase().endsWith(needle.toLowerCase());
		case 'regex':
			try {
				return new RegExp(needle, 'i').test(target);
			} catch (_) {
				return false;
			}
		default:
			return false;
	}
}

const filterRuleService = {

	async add(c, params, userId) {
		const data = normalize(params, false);
		data.userId = userId;
		if (data.enabled === undefined) data.enabled = 1;
		const row = await orm(c).insert(filterRule).values(data).returning().get();
		return row;
	},

	async update(c, params, userId) {
		const id = Number(params.filterRuleId);
		if (!id) throw new BizError('id required');
		const exist = await orm(c).select().from(filterRule)
			.where(and(eq(filterRule.filterRuleId, id), eq(filterRule.userId, userId))).get();
		if (!exist) throw new BizError(t('filterNotExist') || 'filter not exist');
		const set = normalize(params, true);
		if (Object.keys(set).length === 0) return;
		await orm(c).update(filterRule).set(set)
			.where(and(eq(filterRule.filterRuleId, id), eq(filterRule.userId, userId))).run();
	},

	async delete(c, params, userId) {
		const id = Number(params.filterRuleId);
		if (!id) return;
		await orm(c).delete(filterRule)
			.where(and(eq(filterRule.filterRuleId, id), eq(filterRule.userId, userId))).run();
	},

	async list(c, userId) {
		return await orm(c).select().from(filterRule)
			.where(eq(filterRule.userId, userId))
			.orderBy(asc(filterRule.filterRuleId)).all();
	},

	async setEnabled(c, params, userId) {
		const id = Number(params.filterRuleId);
		if (!id) return;
		await orm(c).update(filterRule).set({ enabled: params.enabled ? 1 : 0 })
			.where(and(eq(filterRule.filterRuleId, id), eq(filterRule.userId, userId))).run();
	},

	async executeForEmail(c, emailRow, userId) {
		if (!userId) return { archived: false, labelIds: [] };

		const rules = await orm(c).select().from(filterRule)
			.where(and(eq(filterRule.userId, userId), eq(filterRule.enabled, 1))).all();

		if (!rules.length) return { archived: false, labelIds: [] };

		const ctx = {
			from: emailRow.sendEmail || '',
			to: emailRow.toEmail || '',
			subject: emailRow.subject || '',
			content: (emailRow.text || '') + ' ' + (emailRow.content || '')
		};

		const labelIds = new Set();
		let archive = false;

		for (const rule of rules) {
			if (!matches(rule, ctx)) continue;
			const ats = String(rule.actionType).split(',').filter(Boolean);
			for (const at of ats) {
				if (at === 'archive') {
					archive = true;
				} else if (at === 'label') {
					String(rule.actionValue || '').split(',').forEach(idStr => {
						const id = Number(idStr);
						if (id) labelIds.add(id);
					});
				}
			}
		}

		const validLabelIds = [];
		if (labelIds.size > 0) {
			const ids = Array.from(labelIds);
			const valid = await orm(c).select({ labelId: label.labelId }).from(label)
				.where(and(eq(label.userId, userId), inArray(label.labelId, ids))).all();
			valid.forEach(r => validLabelIds.push(r.labelId));

			if (validLabelIds.length > 0) {
				const existing = await orm(c).select({ labelId: emailLabel.labelId }).from(emailLabel)
					.where(and(
						eq(emailLabel.userId, userId),
						eq(emailLabel.emailId, emailRow.emailId),
						inArray(emailLabel.labelId, validLabelIds)
					)).all();
				const existSet = new Set(existing.map(r => r.labelId));
				const values = validLabelIds
					.filter(id => !existSet.has(id))
					.map(id => ({ userId, emailId: emailRow.emailId, labelId: id }));
				if (values.length > 0) {
					await orm(c).insert(emailLabel).values(values).run();
				}
			}
		}

		if (archive) {
			const email = (await import('../entity/email')).default;
			await orm(c).update(email).set({ archived: 1 })
				.where(eq(email.emailId, emailRow.emailId)).run();
		}

		return { archived: archive, labelIds: validLabelIds };
	}
};

export default filterRuleService;
