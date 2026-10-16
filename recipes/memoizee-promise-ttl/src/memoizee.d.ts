declare module "memoizee" {
  export interface Options {
    maxAge?: number;
    promise?: boolean;
    primitive?: boolean;
    preFetch?: number;
    length?: number | false;
  }

  export interface Memoized<F extends (...args: any[]) => any> {
    (...args: Parameters<F>): ReturnType<F>;
    clear(): void;
    delete(...args: Parameters<F>): boolean;
  }

  function memoize<F extends (...args: any[]) => any>(
    fn: F,
    options?: Options,
  ): Memoized<F>;

  export default memoize;
}
