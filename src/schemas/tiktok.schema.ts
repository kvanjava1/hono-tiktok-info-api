import { z } from 'zod';

/**
 * Schema for TikTok Profile Request
 * Logic: 
 * - type 'instant': callback is optional
 * - type 'callback': callback.url is mandatory
 */
export const tiktokProfileSchema = z.object({
    usernames: z.array(z.string().min(1)).min(1, 'At least one username is required'),
    request: z.object({
        process: z.discriminatedUnion('type', [
            z.object({
                type: z.literal('instant'),
                callback: z.object({
                    url: z.string().url().optional()
                }).optional()
            }),
            z.object({
                type: z.literal('callback'),
                callback: z.object({
                    url: z.string().url({ message: 'Callback URL is required for type "callback"' })
                })
            })
        ])
    })
});

export type TiktokProfileRequest = z.infer<typeof tiktokProfileSchema>;
