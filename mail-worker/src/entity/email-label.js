import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const emailLabel = sqliteTable('email_label', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	emailId: integer('email_id').notNull(),
	labelId: integer('label_id').notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export default emailLabel;
