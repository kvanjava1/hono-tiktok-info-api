import type { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as TiktokController from '../controllers/tiktok.controller.ts';
import { tiktokProfileSchema } from '../schemas/tiktok.schema.ts';

import { ValidationError } from '../utils/errors.ts';

export const registerTiktokRoutes = (app: Hono) => {
    // Routes are now protected globally in src/routes/index.ts
    app.post(
        '/tiktok/profiles',
        zValidator('json', tiktokProfileSchema, (result) => {
            if (!result.success) {
                // const details = result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
                // throw new ValidationError(`Validation failed: ${details}`, (result.error as any).format());
                throw new ValidationError(result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '));
            }
        }),
        TiktokController.getProfiles
    );
    app.get('/tiktok/profiles/:requestId/request', TiktokController.getRequestStatus);
    app.post('/tiktok/profiles/:requestId/request/cancel', TiktokController.cancelRequest);
};
