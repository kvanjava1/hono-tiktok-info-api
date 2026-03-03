import { tiktokProfileSchema } from './src/schemas/tiktok.schema.ts';
import { z } from 'zod';

const testCases = [
    {
        name: 'Valid Instant',
        data: {
            usernames: ['@user1'],
            request: {
                process: { type: 'instant' }
            }
        },
        expected: true
    },
    {
        name: 'Valid Callback',
        data: {
            usernames: ['@user1'],
            request: {
                process: {
                    type: 'callback',
                    callback: { url: 'https://example.com/hook' }
                }
            }
        },
        expected: true
    },
    {
        name: 'Invalid Callback (Missing URL)',
        data: {
            usernames: ['@user1'],
            request: {
                process: { type: 'callback' }
            }
        },
        expected: false
    },
    {
        name: 'Invalid Username (Empty)',
        data: {
            usernames: [],
            request: {
                process: { type: 'instant' }
            }
        },
        expected: false
    }
];

console.log('--- Testing TikTok Profile Schema ---');

testCases.forEach(tc => {
    const result = tiktokProfileSchema.safeParse(tc.data);
    if (result.success === tc.expected) {
        console.log(`✅ [${tc.name}]: Passed`);
    } else {
        console.log(`❌ [${tc.name}]: Failed`);
        if (!result.success) {
            console.log('   Errors:', result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '));
        }
    }
});
