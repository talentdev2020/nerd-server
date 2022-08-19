import { Bitly } from 'src/data-sources';

export default function create(url: string): Bitly {
  const bitly: Partial<Bitly> = {
    shortenLongUrl: (l: string, g: string) => Promise.resolve(url),
    getLink: () => Promise.resolve(url),
  };

  return bitly as Bitly;
}
