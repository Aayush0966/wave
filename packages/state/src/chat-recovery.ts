/** Buffers realtime changes until an HTTP snapshot is merged, so snapshots cannot undo newer events. */
export function createSyncQueue(
	sync: () => Promise<void>,
	status: (value: "syncing" | "synced" | "retrying") => void,
) {
	let running: Promise<void> | null = null;
	let disposed = false;
	const events: (() => void)[] = [];
	return {
		apply(action: () => void) {
			if (disposed) return;
			if (running) events.push(action);
			else action();
		},
		resync() {
			if (disposed) return Promise.resolve();
			if (running) return running;
			status("syncing");
			running = Promise.resolve()
				.then(sync)
				.then(() => {
					if (!disposed) status("synced");
				})
				.catch(() => {
					if (!disposed) status("retrying");
				})
				.finally(() => {
					running = null;
					if (!disposed) for (const event of events.splice(0)) event();
				});
			return running;
		},
		dispose() {
			disposed = true;
			events.length = 0;
		},
	};
}

/** Keeps failed receipts queued with backoff; navigation and focus changes cannot bypass it. */
export function createReceiptQueue(mark: (ids: string[]) => Promise<void>) {
	let ids = new Set<string>();
	const completed = new Set<string>();
	let visible = false;
	let disposed = false;
	let working = false;
	let attempts = 0;
	let timer: ReturnType<typeof setTimeout> | null = null;
	const pump = () => {
		if (disposed || working || timer || !visible || !ids.size) return;
		const batch = [...ids].slice(0, 100);
		working = true;
		Promise.resolve()
			.then(() => mark(batch))
			.then(() => {
				for (const id of batch) {
					completed.add(id);
					ids.delete(id);
				}
				attempts = 0;
			})
			.catch(() => {
				if (disposed) return;
				timer = setTimeout(
					() => {
						timer = null;
						pump();
					},
					Math.min(30000, 1000 * 2 ** attempts++),
				);
			})
			.finally(() => {
				working = false;
				pump();
			});
	};
	return {
		replace(next: string[], focused: boolean) {
			if (disposed) return;
			ids = new Set(next.filter((id) => !completed.has(id)));
			visible = focused;
			if (!ids.size && timer) {
				clearTimeout(timer);
				timer = null;
			}
			pump();
		},
		dispose() {
			disposed = true;
			ids.clear();
			if (timer) clearTimeout(timer);
		},
	};
}
