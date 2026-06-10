import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const signature = sqliteTable('signature', {
	sigId: integer('sig_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	name: text('name').notNull(),
	content: text('content').notNull().default(''),
	isDefault: integer('is_default').default(0).notNull(),
	isCompany: integer('is_company').default(0).notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export default signature;
