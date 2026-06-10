import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const filterRule = sqliteTable('filter_rule', {
	filterRuleId: integer('filter_rule_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	name: text('name').notNull(),
	field: text('field').notNull(),
	operator: text('operator').notNull(),
	value: text('value').notNull(),
	actionType: text('action_type').notNull(),
	actionValue: text('action_value').default(''),
	enabled: integer('enabled').default(1).notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export default filterRule;
