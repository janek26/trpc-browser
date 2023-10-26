import { retry, wait } from '../src/shared/retry';

describe('retry function', () => {
  it('should retry the function for the specified number of times', async () => {
    let counter = 0;
    const fn = () => {
      counter++;
      if (counter < 3) {
        throw new Error('Error');
      }
      return 'Success';
    };
    const result = await retry(fn, 3, wait);
    expect(result).toBe('Success');
  });

  it('should throw an error if the function fails after the specified number of retries', async () => {
    const fn = () => {
      throw new Error('Error');
    };
    await expect(retry(fn, 3, wait)).rejects.toThrow('Error');
  });

  it('should pass the number of retries to the wait function', async () => {
    const fn = () => {
      throw new Error('Error');
    };
    const waitFn = jest.fn(wait);
    await expect(retry(fn, 3, waitFn)).rejects.toThrow('Error');
    expect(waitFn).toHaveBeenCalledTimes(3);
    expect(waitFn).toHaveBeenNthCalledWith(1, 1);
    expect(waitFn).toHaveBeenNthCalledWith(2, 2);
    expect(waitFn).toHaveBeenNthCalledWith(3, 3);
  });
});

describe('wait function', () => {
  it('should wait for the specified number of milliseconds', async () => {
    const start = Date.now();
    await wait(100);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(100);
  });
});
