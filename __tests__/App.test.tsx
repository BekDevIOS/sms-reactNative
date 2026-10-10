/**
 * Unit tests for the API client. These avoid native modules (no rendering of App)
 * so they run under plain Jest. The full app is validated on-device.
 * @format
 */

import {ApiClient, InvalidCodeError, UnauthorizedError} from '../src/api/client';
import {smsLength} from '../src/lib/sms';

function mockFetch(status: number, body: unknown) {
  // @ts-ignore - replacing global fetch for the test
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

describe('ApiClient', () => {
  it('claim() returns the token/device payload on success', async () => {
    mockFetch(200, {token: 'tok', device: {deviceId: 'd1', name: 'Pixel', sendLimitPerMinute: 60}});
    const res = await ApiClient.claim('http://x:4008', 'ABC23XYZ');
    expect(res.token).toBe('tok');
    expect(res.device.name).toBe('Pixel');
  });

  it('claim() maps HTTP 401 to InvalidCodeError', async () => {
    mockFetch(401, 'Unauthorized');
    await expect(ApiClient.claim('http://x:4008', 'BAD')).rejects.toBeInstanceOf(InvalidCodeError);
  });

  it('authenticated calls map HTTP 401 to UnauthorizedError', async () => {
    mockFetch(401, 'Unauthorized');
    const client = new ApiClient('http://x:4008', 'expired-token');
    await expect(client.pollJobs(10)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('report() parses the success flag', async () => {
    mockFetch(200, {success: false});
    const client = new ApiClient('http://x:4008', 'tok');
    const res = await client.report({recipientId: 'r1', status: 'SENT'});
    expect(res.success).toBe(false);
  });
});

describe('smsLength', () => {
  it('uses GSM multipart limits for plain Latin text', () => {
    expect(smsLength('a'.repeat(161))).toMatchObject({encoding: 'GSM-7', segments: 2});
  });

  it('uses Unicode limits for Uzbek characters outside GSM-7', () => {
    expect(smsLength('o‘quvchi')).toMatchObject({encoding: 'Unicode', segments: 1});
    expect(smsLength('‘'.repeat(71))).toMatchObject({encoding: 'Unicode', segments: 2});
  });
});
