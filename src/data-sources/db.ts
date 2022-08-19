// // This is a base class for DataSources that allow direct access to a specified mongo model

import { DataSource } from 'apollo-datasource';
// import { Model } from 'mongoose';
// import { FilterQuery } from 'mongodb';
// import { AnyObj, AnyMongooseDoc } from '../types/common';
// import { logger } from '../common';
abstract class Db extends DataSource {
  //   abstract model: Model<AnyMongooseDoc>;
  //   constructor() {
  //     super();
  //   }
  //   async create(object: AnyObj) {
  //     try {
  //       logger.debug(`data-sources.db.${this.model.modelName}.create:--start`);
  //       const doc = new this.model(object);
  //       const res = await doc.save();
  //       logger.debug(`data-sources.db.${this.model.modelName}.create:--done`);
  //       return res ? res : {};
  //     } catch (error) {
  //       logger.warn(
  //         `data-sources.db.${this.model.modelName}.create.catch:${error}`,
  //       );
  //       throw error;
  //     }
  //   }
  //   async findById(id: string) {
  //     try {
  //       logger.debug(
  //         `data-sources.db.${this.model.modelName}.findById:${id}--start`,
  //       );
  //       const res = await this.model.findById(id);
  //       logger.debug(
  //         `data-sources.db.${this.model.modelName}.findById:${id}--done`,
  //       );
  //       return res ? res : {};
  //     } catch (error) {
  //       logger.warn(
  //         `data-sources.db.${this.model.modelName}.findById.catch:${error}`,
  //       );
  //       throw error;
  //     }
  //   }
  //   async findOne(query: FilterQuery<AnyMongooseDoc>) {
  //     try {
  //       logger.debug(`data-sources.db.${this.model.modelName}.findOne:--start`);
  //       const res = await this.model.findOne(query);
  //       logger.debug(`data-sources.db.${this.model.modelName}.findOne:--done`);
  //       return res ? res : {};
  //     } catch (error) {
  //       logger.warn(
  //         `data-sources.db.${this.model.modelName}.findOne.catch:${error}`,
  //       );
  //       throw error;
  //     }
  //   }
  //   async find(query: FilterQuery<AnyMongooseDoc>) {
  //     try {
  //       logger.debug(`data-sources.db.${this.model.modelName}.find--start`);
  //       const res = await this.model.find(query);
  //       logger.debug(`data-sources.db.${this.model.modelName}.find--done`);
  //       return Array.isArray(res) ? res.filter(r => r) : [];
  //     } catch (error) {
  //       logger.warn(
  //         `data-sources.db.${this.model.modelName}.find.catch:${error}`,
  //       );
  //       throw error;
  //     }
  //   }
  //   async updateById(id: string, updates: AnyObj) {
  //     try {
  //       logger.debug(
  //         `data-sources.db.${this.model.modelName}.updateById:${id}--start`,
  //       );
  //       const res = await this.model.findByIdAndUpdate(id, updates);
  //       logger.debug(
  //         `data-sources.db.${this.model.modelName}.updateById:${id}--done`,
  //       );
  //       return res ? res : {};
  //     } catch (error) {
  //       logger.warn(
  //         `data-sources.db.${this.model.modelName}.updateById.catch:${error}`,
  //       );
  //       throw error;
  //     }
  //   }
  //   async updateOne(query: FilterQuery<AnyObj>, updates: AnyObj) {
  //     try {
  //       logger.debug(`data-sources.db.${this.model.modelName}.updateOne:--start`);
  //       const res = await this.model.updateOne(query, updates);
  //       logger.debug(`data-sources.db.${this.model.modelName}.updateOne:--done`);
  //       return res ? res : {};
  //     } catch (error) {
  //       logger.warn(
  //         `data-sources.db.${this.model.modelName}.updateOne.catch:${error}`,
  //       );
  //       throw error;
  //     }
  //   }
  //   async updateMany(query: FilterQuery<AnyObj>, updates: AnyObj) {
  //     try {
  //       logger.debug(
  //         `data-sources.db.${this.model.modelName}.updateMany:--start`,
  //       );
  //       const res = await this.model.updateMany(query, updates);
  //       logger.debug(`data-sources.db.${this.model.modelName}.updateMany:--done`);
  //       return Array.isArray(res) ? res.filter(r => r) : [];
  //     } catch (error) {
  //       logger.warn(
  //         `data-sources.db.${this.model.modelName}.updateManu.catch:${error}`,
  //       );
  //       throw error;
  //     }
  //   }
  //   async deleteById(id: string) {
  //     try {
  //       logger.debug(
  //         `data-sources.db.${this.model.modelName}.deleteById:${id}--start `,
  //       );
  //       const res = await this.model.findByIdAndDelete(id);
  //       logger.debug(
  //         `data-sources.db.${this.model.modelName}.deleteById:${id}--done `,
  //       );
  //       return res ? res : {};
  //     } catch (error) {
  //       logger.warn(
  //         `data-sources.db.${this.model.modelName}.deleteById.catch:${error}`,
  //       );
  //       throw error;
  //     }
  //   }
  //   async aggregate(pipeline: AnyObj[]) {
  //     try {
  //       logger.debug(`data-sources.db.${this.model.modelName}.aggregate:--start`);
  //       const res = await this.model.aggregate(pipeline);
  //       logger.debug(`data-sources.db.${this.model.modelName}.aggregate:--end`);
  //       return Array.isArray(res) ? res.filter(r => r) : [];
  //     } catch (error) {
  //       logger.warn(
  //         `data-sources.db.${this.model.modelName}.aggregate.catch:${error}`,
  //       );
  //       throw error;
  //     }
  //   }
}

export default Db;
