import app from './hono/webs';
import { email } from './email/email';
import userService from './service/user-service';
import verifyRecordService from './service/verify-record-service';
import emailService from './service/email-service';
import kvObjService from './service/kv-obj-service';
import oauthService from "./service/oauth-service";
import analysisService from './service/analysis-service';
export default {
	 async fetch(req, env, ctx) {

		// Force HTTPS redirect for all requests
		if (req.headers.get('X-Forwarded-Proto') === 'http') {
			const url = new URL(req.url);
			url.protocol = 'https:';
			return Response.redirect(url.toString(), 301);
		}

		const url = new URL(req.url)

		if (url.pathname.startsWith('/api/')) {
			url.pathname = url.pathname.replace('/api', '')
			req = new Request(url.toString(), req)
			return app.fetch(req, env, ctx);
		}

		 if (['/static/','/attachments/'].some(p => url.pathname.startsWith(p))) {
			 return await kvObjService.toObjResp( { env }, url.pathname.substring(1));
		 }

		const assetResp = await env.assets.fetch(req);

		// Prevent CF CDN from caching HTML (avoids cache-HIT blocking redirect updates)
		const headers = new Headers(assetResp.headers);
		headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
		return new Response(assetResp.body, {
			status: assetResp.status,
			statusText: assetResp.statusText,
			headers
		});
	},
	email: email,
	async scheduled(c, env, ctx) {
		if (c.cron === '*/30 * * * *') {
			await analysisService.refreshEchartsCache({ env })
			return;
		}

		await verifyRecordService.clearRecord({ env })
		await userService.resetDaySendCount({ env })
		await emailService.completeReceiveAll({ env })
		await oauthService.clearNoBindOathUser({ env })
		await analysisService.refreshEchartsCache({ env })
	},
};
