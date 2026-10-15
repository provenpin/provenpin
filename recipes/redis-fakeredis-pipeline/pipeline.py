import fakeredis
import redis


def make_server():
    # a single shared FakeServer is what makes WATCH visible across clients
    server = fakeredis.FakeServer()
    return server, fakeredis.FakeRedis(server=server, decode_responses=True), fakeredis.FakeRedis(server=server, decode_responses=True)


def transfer(r, src, dst, amount, retries=3):
    with r.pipeline() as pipe:
        for _ in range(retries):
            try:
                pipe.watch(src, dst)
                if int(pipe.get(src) or 0) < amount:
                    pipe.unwatch()
                    return False
                pipe.multi()
                pipe.decrby(src, amount)
                pipe.incrby(dst, amount)
                pipe.execute()
                return True
            except redis.WatchError:
                continue
    raise RuntimeError("too much contention")
