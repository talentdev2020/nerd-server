import { Bitly } from 'src/data-sources';
import { DataSources } from 'src/types';

export default function create(bitly: Bitly): DataSources {
  const dataSources: Partial<DataSources> = {
    bitly: (bitly as Partial<Bitly>) as Bitly,
    linkShortener: (bitly as Partial<Bitly>) as Bitly,
  };

  return dataSources as DataSources;
}
