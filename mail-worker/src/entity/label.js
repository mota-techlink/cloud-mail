import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const label = sqliteTable('label', {
	labelId: integer('label_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	name: text('name').notNull(),
	color: text('color').notNull().default('#1890ff'),
	parentId: integer('parent_id').notNull().default(0),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export default label;
