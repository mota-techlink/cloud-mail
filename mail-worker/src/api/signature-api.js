import app from '../hono/hono';
import signatureService from '../service/signature-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.get('/signature/list', async (c) => {
	const data = await signatureService.list(c, userContext.getUser(c));
	return c.json(result.ok(data));
});

app.post('/signature/add', async (c) => {
	const data = await signatureService.add(c, await c.req.json(), userContext.getUser(c));
	return c.json(result.ok(data));
});

app.put('/signature/update', async (c) => {
	await signatureService.update(c, await c.req.json(), userContext.getUser(c));
	return c.json(result.ok());
});

app.delete('/signature/delete', async (c) => {
	await signatureService.delete(c, c.req.query(), userContext.getUser(c));
	return c.json(result.ok());
});

app.put('/signature/setDefault', async (c) => {
	await signatureService.setDefault(c, await c.req.json(), userContext.getUser(c));
	return c.json(result.ok());
});

app.post('/signature/company/add', async (c) => {
	const data = await signatureService.addCompany(c, await c.req.json(), userContext.getUser(c));
	return c.json(result.ok(data));
});
