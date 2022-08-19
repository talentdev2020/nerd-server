import * as fs from 'fs';

export const writePipeline = (pipeline: any[]) => {
  fs.writeFileSync(
    'PIPELINE.ts',
    `const pipeline = ${JSON.stringify(pipeline)}`,
  );

  return pipeline;
};
