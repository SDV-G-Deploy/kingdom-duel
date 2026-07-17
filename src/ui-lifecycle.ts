export type TimerPlatform<Handle> = {
  setTimeout: (callback: () => void, delay: number) => Handle;
  clearTimeout: (handle: Handle) => void;
};

export class CancellableTimer<Handle> {
  private handle: Handle | null = null;

  constructor(private readonly platform: TimerPlatform<Handle>) {}

  get pending(): boolean {
    return this.handle !== null;
  }

  schedule(callback: () => void, delay: number): void {
    this.cancel();
    let scheduledHandle: Handle;
    scheduledHandle = this.platform.setTimeout(() => {
      if (this.handle !== scheduledHandle) return;
      this.handle = null;
      callback();
    }, delay);
    this.handle = scheduledHandle;
  }

  cancel(): void {
    if (this.handle === null) return;
    this.platform.clearTimeout(this.handle);
    this.handle = null;
  }
}

export const FOCUS_ATTRIBUTES = ['data-cell', 'data-spell', 'data-action', 'data-view'] as const;

export type FocusAttribute = (typeof FOCUS_ATTRIBUTES)[number];

export type FocusIdentity = {
  attribute: FocusAttribute;
  value: string;
};

export function chooseFocusIdentity(
  attributes: Partial<Record<FocusAttribute, string | null | undefined>>,
): FocusIdentity | null {
  for (const attribute of FOCUS_ATTRIBUTES) {
    const value = attributes[attribute];
    if (value !== undefined && value !== null) return { attribute, value };
  }
  return null;
}
