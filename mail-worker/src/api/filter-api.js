import app from '../hono/hono';
import filterRuleService from '../service/filter-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.get('/filter/list', async (c) => {
	const data = await filterRuleService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/filter/add', async (c) => {
	const data = await filterRuleService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.put('/filter/update', async (c) => {
	await filterRuleService.update(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/filter/delete', async (c) => {
	await filterRuleService.delete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.put('/filter/enabled', async (c) => {
	await filterRuleService.setEnabled(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});
