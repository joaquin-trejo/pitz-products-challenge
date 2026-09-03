type MediaQueryListStub = Pick<
  MediaQueryList,
  'matches' | 'media' | 'onchange' | 'addListener' | 'removeListener' | 'addEventListener' | 'removeEventListener' | 'dispatchEvent'
>

export function stubMatchMedia(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryListStub => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
