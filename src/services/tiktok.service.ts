import { NotFoundError, ScrapingError, ValidationError, ForbiddenError, ConflictError } from '../utils/errors.ts';
import { logger } from '../utils/logger.ts';
import { cacheMGet, cacheMSet } from '../utils/cache.ts';
import * as TiktokRequestRepository from '../repositories/tiktokRequest.repository.ts';
import { tiktokScrapeQueue, dispatchTiktokScrape } from '../jobs/TiktokScrape.job.ts';

// --- Constants ---
const CACHE_PREFIX = 'tt:profile:';
const CACHE_TTL = 86400; // 24 hours
const BATCH_SIZE = 10;
const BATCH_DELAY = 1000;

export const processScrapeProfileInfo = async (username: string) => {
    const url = `https://www.tiktok.com/${username}`;
    logger.info(`[TiktokService] Fetching profile for: ${username}`);

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new NotFoundError(`TikTok user ${username} not found`);
        }
        throw new ScrapingError(`Failed to fetch TikTok page. Status: ${response.status}`);
    }

    const html = await response.text();

    // Extract the __UNIVERSAL_DATA_FOR_REHYDRATION__ script content
    const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"([^>]*)>([^<]+)<\/script>/);

    if (!scriptMatch || scriptMatch.length < 3) {
        throw new ScrapingError('Could not find rehydration data in the HTML. TikTok might have changed their structure or triggered a captcha.');
    }

    const rawJsonData = scriptMatch[2] as string;
    const parsedData = JSON.parse(rawJsonData);

    // TikTok's internal JSON structure is heavily nested. We need to navigate carefully.
    // The structure usually is: parsedData["__DEFAULT_SCOPE__"]["webapp.user-detail"]["userInfo"]
    const defaultScope = parsedData.__DEFAULT_SCOPE__;
    if (!defaultScope) {
        throw new ScrapingError('Invalid structure: Missing __DEFAULT_SCOPE__');
    }

    const userDetail = defaultScope['webapp.user-detail'];
    if (!userDetail || !userDetail.userInfo) {
        throw new ScrapingError('Could not extract user details from the state object.');
    }

    const { user, stats } = userDetail.userInfo;

    return {
        source: 'universal_data',
        user: {
            id: user.id,
            secUid: user.secUid,
            username: user.uniqueId,
            nickname: user.nickname,
            avatar: user.avatarLarger || user.avatarMedium || user.avatarThumb,
            signature: user.signature,
            verified: user.verified,
            privateAccount: user.secret,
            region: user.region,
            bioLink: user.bioLink?.link || null,
            createTime: user.createTime,
            language: user.language,
            isOrganization: !!user.isOrganization
        },
        stats: {
            followerCount: stats.followerCount,
            followingCount: stats.followingCount,
            heartCount: stats.heart || stats.heartCount, // Favor the large 'heart' number
            videoCount: stats.videoCount,
            diggCount: stats.diggCount,
            friendCount: stats.friendCount
        }
    };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

export const getProfilesInfo = async (usernames: string[], requestId?: string) => {

    // 1. Check Cache First
    const cacheKeys = usernames.map(u => `${CACHE_PREFIX}${u.toLowerCase()}`);
    const cachedData = await cacheMGet<any>(cacheKeys);

    const resultsMap = new Map<string, any>();
    const missedUsernames: string[] = [];

    usernames.forEach((username, index) => {
        const cached = cachedData[index];
        if (cached) {
            resultsMap.set(username.toLowerCase(), {
                username,
                status: 'success',
                data: cached,
                _from_cache: true
            });
        } else {
            missedUsernames.push(username);
        }
    });

    if (missedUsernames.length === 0) {
        logger.info(`[TiktokService] All ${usernames.length} profiles retrieved from cache.`);
        return usernames.map(u => resultsMap.get(u.toLowerCase()));
    }

    logger.info(`[TiktokService] Cache hits: ${usernames.length - missedUsernames.length}, Misses: ${missedUsernames.length}`);

    // 2. Process Misses in Batches
    const chunks = chunkArray(missedUsernames, BATCH_SIZE);

    for (const [index, chunk] of chunks.entries()) {
        // Cooperative Cancellation Check
        if (requestId) {
            const status = TiktokRequestRepository.getStatus(requestId);
            if (status === 'cancelled') {
                logger.info(`[TiktokService] Request ${requestId} was cancelled. Aborting.`);
                break;
            }
        }

        logger.info(`[TiktokService] Processing batch ${index + 1}/${chunks.length} (${chunk.length} profiles)`);

        const batchResults = await Promise.all(chunk.map(async (username) => {
            try {
                const data = await processScrapeProfileInfo(username);
                return { username, status: 'success', data };
            } catch (error: any) {
                return { username, status: 'error', message: error.message };
            }
        }));

        // 3. Cache Success Results
        const cacheItems = batchResults
            .filter(r => r.status === 'success')
            .map(r => ({
                key: `${CACHE_PREFIX}${r.username.toLowerCase()}`,
                value: r.data,
                ttlSeconds: CACHE_TTL
            }));

        if (cacheItems.length > 0) {
            await cacheMSet(cacheItems);
        }

        // Add to result map
        batchResults.forEach(r => resultsMap.set(r.username.toLowerCase(), r));

        if (index < chunks.length - 1) {
            await sleep(BATCH_DELAY);
        }
    }

    // 4. Return in original order
    return usernames.map(u => resultsMap.get(u.toLowerCase()));
};

/**
 * Cancel a TikTok profiles request
 * Uses centralized error handling by throwing custom errors.
 */
export const cancelRequest = async (requestId: string, clientId: string) => {
    const request = TiktokRequestRepository.findById(requestId);

    if (!request) {
        throw new NotFoundError(`Request with ID ${requestId} not found`);
    }

    if (request.client_id !== clientId) {
        throw new ForbiddenError('You do not have permission to access this request');
    }

    if (request.process_status === 'done' || request.process_status === 'cancelled') {
        throw new ValidationError(`Request is already in ${request.process_status} status and cannot be cancelled`);
    }

    // 1. Update DB Status
    TiktokRequestRepository.cancel(requestId);

    // 2. Attempt to remove from queue (if not started yet)
    try {
        const job = await tiktokScrapeQueue.getJob(requestId);
        if (job) {
            const state = await job.getState();
            if (state === 'waiting' || state === 'delayed') {
                await job.remove();
                logger.info(`[TiktokService] Removed job ${requestId} from queue.`);
            }
        }
    } catch (error: any) {
        logger.warn(`[TiktokService] Failed to remove job ${requestId} from queue: ${error.message}`);
    }
};

/**
 * Initialize a TikTok profiles request (Instant or Callback)
 */
export const initializeProfilesRequest = async (usernames: string[], config: any, clientId: string) => {
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
        throw new ValidationError('usernames must be a non-empty array of strings');
    }

    // Normalize and Validate Usernames
    const normalizedUsernames = usernames.map(u => {
        let username = u.trim();
        if (!username.startsWith('@')) {
            username = `@${username}`;
        }
        return username;
    });

    const usernameRegex = /^@[\w.]{2,24}$/;
    for (const username of normalizedUsernames) {
        if (!usernameRegex.test(username) || username.endsWith('.')) {
            throw new ValidationError(`Invalid TikTok username format: ${username}. Usernames must start with @, be 2-24 characters long, and can only contain letters, numbers, underscores, and periods (cannot end with a period).`);
        }
    }

    const processType = config?.type || 'instant';

    if (processType === 'instant') {
        if (normalizedUsernames.length > 1) {
            throw new ValidationError('Only 1 username is allowed for instant process type');
        }

        return await getProfilesInfo(normalizedUsernames);
    }

    if (processType === 'callback') {
        const callbackUrl = config?.callback?.url;
        if (!callbackUrl) {
            throw new ValidationError('callback.url is required for callback process type');
        }

        // Check for active job
        const activeRequest = TiktokRequestRepository.findActiveByClientId(clientId);
        if (activeRequest) {
            throw new ConflictError(`Client already has an active processing request: ${activeRequest.request_id}`);
        }

        const requestId = crypto.randomUUID();

        // Create DB Record
        TiktokRequestRepository.create({
            request_id: requestId,
            client_id: clientId,
            usernames: JSON.stringify(normalizedUsernames),
            total_username: normalizedUsernames.length,
            process_status: 'pending',
            callback_url: callbackUrl
        });

        // Enqueue Job
        await dispatchTiktokScrape({
            requestId,
            usernames: normalizedUsernames,
            callbackUrl
        });

        return {
            request_id: requestId,
            total_username: normalizedUsernames.length,
            total_process: 0,
            total_error: 0,
            total_success: 0,
            process_status: 'pending'
        };
    }

    throw new ValidationError(`Invalid process type: ${processType}`);
};

/**
 * Get the status and results of a TikTok profiles request
 */
export const getRequestStatus = async (requestId: string, clientId: string) => {
    const request = TiktokRequestRepository.findById(requestId);

    if (!request) {
        throw new NotFoundError(`Request with ID ${requestId} not found`);
    }

    if (request.client_id !== clientId) {
        throw new ForbiddenError('You do not have permission to access this request');
    }

    const percentage = request.total_username > 0
        ? Math.round((request.total_process / request.total_username) * 100)
        : 0;

    return {
        request_id: request.request_id,
        total_username: request.total_username,
        total_process: request.total_process,
        total_error: request.total_error,
        total_success: request.total_success,
        process_percentage: percentage,
        process_status: request.process_status,
        created_at: request.created_at,
        result: request.result ? JSON.parse(request.result) : null
    };
};
