from intervaltree import IntervalTree


class RoomSchedule:
    def __init__(self):
        self.tree = IntervalTree()

    def reserve(self, start, end, who):
        if end <= start:
            raise ValueError("end must be after start")
        clash = self.tree.overlap(start, end)
        if clash:
            names = ", ".join(sorted(iv.data for iv in clash))
            raise ValueError(f"double booked with {names}")
        self.tree.addi(start, end, who)

    def who_at(self, moment):
        return sorted(iv.data for iv in self.tree.at(moment))

    def clashes(self, start, end):
        return sorted((iv.begin, iv.end, iv.data) for iv in self.tree.overlap(start, end))

    def busy_blocks(self):
        blocks = self.tree.copy()
        blocks.merge_overlaps(strict=False)
        return sorted((iv.begin, iv.end) for iv in blocks)

    def block_out(self, start, end):
        self.tree.chop(start, end)

    def split_at(self, moment):
        self.tree.slice(moment)
