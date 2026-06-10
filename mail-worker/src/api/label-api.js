import app from '../hono/hono';
import labelService from '../service/label-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.post('/label/add', async (c) => {
	const data = await labelService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.put('/label/update', async (c) => {
	await labelService.update(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/label/delete', async (c) => {
	await labelService.delete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/label/list', async (c) => {
	const data = await labelService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/label/attach', async (c) => {
	await labelService.attach(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.post('/label/batch-attach', async (c) => {
	await labelService.batchAttach(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/label/email/list', async (c) => {
	const data = await labelService.emailList(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(data));
});
