from arq import Retry, Worker, func


async def send_welcome(ctx, user_id: int) -> str:
    return f"welcome:{user_id}"


async def notify(ctx, user_id: int) -> str:
    # jobs can enqueue follow-up work through the shared redis pool
    await ctx["redis"].enqueue_job("send_welcome", user_id)
    return f"notified:{user_id}"


async def flaky_sync(ctx, until_try: int) -> int:
    if ctx["job_try"] < until_try:
        raise Retry()
    return ctx["job_try"]


def make_worker(redis, **kwargs) -> Worker:
    return Worker(
        [send_welcome, notify, func(flaky_sync, max_tries=3)],
        redis_pool=redis,
        burst=True,
        handle_signals=False,
        poll_delay=0.01,
        **kwargs,
    )
