import * as fs from 'fs-extra';
import * as path from 'path';
import { S3 } from 'nestjs-s3';
import { Readable } from 'stream';

interface SaveFileOptions {
  ContentType?: string;
}

abstract class FileManager {
  abstract createDirIfNotExist(dirPath: string): Promise<void>;

  abstract removeDirIfExist(dirPath: string): Promise<void>;

  abstract saveFile(
    destDirPath: string,
    buffer: any,
    options?: SaveFileOptions,
  ): Promise<void>;

  abstract getFileReadSteam(filePath: string): Promise<Readable>;

  abstract isExists(filePath: string): Promise<boolean>;
}

class FileFileManager extends FileManager {
  private rootDir = process.cwd();

  private _getFullPath(p: string) {
    return path.join(this.rootDir, p);
  }

  async createDirIfNotExist(dirPath: string) {
    const fullPath = this._getFullPath(dirPath);

    if (!(await fs.pathExists(fullPath))) {
      await fs.mkdir(fullPath);
    }
  }

  async removeDirIfExist(dirPath: string) {
    const fullPath = this._getFullPath(dirPath);

    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
    }
  }

  async saveFile(destDirPath: string, buffer: any) {
    await fs.writeFile(destDirPath, buffer);
  }

  async getFileReadSteam(filePath: string) {
    const fullPath = this._getFullPath(filePath);
    return fs.createReadStream(fullPath);
  }

  async isExists(filePath: string) {
    const fullPath = this._getFullPath(filePath);
    return fs.pathExists(fullPath);
  }
}

class S3FileManager extends FileManager {
  private s3: S3;
  private bucket: string;

  constructor(s3: S3, bucket: string) {
    super();
    this.s3 = s3;
    this.bucket = bucket;
  }

  _safePath(p: string) {
    return p.replace(/\\+/g, '/');
  }

  async createDirIfNotExist(_dirPath: string): Promise<void> {
    return;
  }

  async removeDirIfExist(dirPath: string): Promise<void> {
    await this.s3
      .deleteObject({
        Bucket: this.bucket,
        Key: this._safePath(dirPath),
      })
      .promise();
  }

  async saveFile(destDirPath: string, buffer: any, options?: SaveFileOptions) {
    const { ContentType } = options || {};
    await this.s3
      .putObject({
        Bucket: this.bucket,
        Key: this._safePath(destDirPath),
        Body: buffer,
        ContentType,
      })
      .promise();
  }

  async getFileReadSteam(filePath: string) {
    const stream = this.s3
      .getObject({
        Bucket: this.bucket,
        Key: this._safePath(filePath),
      })
      .createReadStream();

    return stream;
  }

  async isExists(filePath: string) {
    try {
      await this.s3
        .headObject({
          Bucket: this.bucket,
          Key: this._safePath(filePath),
        })
        .promise();
      return true;
    } catch (e) {
      return false;
    }
  }
}

export { FileFileManager, S3FileManager, FileManager };
