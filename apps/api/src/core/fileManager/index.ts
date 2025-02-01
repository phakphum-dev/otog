import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import * as fsExtra from 'fs-extra'
import { mkdir, writeFile } from 'fs/promises'
import fs from 'node:fs'
import * as path from 'path'
import { environment } from 'src/env'
import { Readable } from 'stream'

interface SaveFileOptions {
  ContentType?: string
}

abstract class FileManager {
  abstract listFiles(dirPath: string): Promise<string[]>

  abstract createDirIfNotExist(dirPath: string): Promise<void>

  abstract removeDirIfExist(dirPath: string): Promise<void>

  abstract putFile(
    path: string,
    buffer: any,
    options?: SaveFileOptions
  ): Promise<void>

  abstract getFileReadStream(filePath: string): Promise<Readable>

  abstract isExists(filePath: string): Promise<boolean>
}

class LocalFileManager extends FileManager {
  private rootDir = process.cwd()

  private _getFullPath(p: string) {
    return path.join(this.rootDir, p)
  }

  async listFiles(dirPath: string): Promise<string[]> {
    return fsExtra.readdir(this._getFullPath(dirPath))
  }

  async createDirIfNotExist(dirPath: string) {
    const fullPath = this._getFullPath(dirPath)

    if (!(await fsExtra.pathExists(fullPath))) {
      await mkdir(fullPath)
    }
  }

  async removeDirIfExist(dirPath: string) {
    const fullPath = this._getFullPath(dirPath)

    if (await fsExtra.pathExists(fullPath)) {
      await fsExtra.remove(fullPath)
    }
  }

  async putFile(destDirPath: string, buffer: any) {
    await writeFile(destDirPath, buffer)
  }

  async getFileReadStream(filePath: string) {
    const fullPath = this._getFullPath(filePath)
    return fs.createReadStream(fullPath)
  }

  async isExists(filePath: string) {
    const fullPath = this._getFullPath(filePath)
    return fsExtra.pathExists(fullPath)
  }
}

class S3FileManager extends FileManager {
  private readonly s3: S3Client
  private bucket: string

  constructor(bucket: string) {
    super()
    this.s3 = new S3Client({
      region: environment.S3_REGION,
      endpoint: environment.S3_ENDPOINT,
      credentials: {
        accessKeyId: environment.S3_ACCESS_KEY_ID,
        secretAccessKey: environment.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    })
    this.bucket = bucket
  }

  _safePath(p: string) {
    return p.replace(/\\+/g, '/')
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const command = new ListObjectsCommand({
      Bucket: this.bucket,
      Prefix: this._safePath(dirPath),
    })
    const response = await this.s3.send(command)
    return response.Contents?.map((c) => c.Key ?? '') || []
  }

  async createDirIfNotExist(): Promise<void> {}

  async removeDirIfExist(dirPath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this._safePath(dirPath),
    })
    await this.s3.send(command)
  }

  async putFile(destDirPath: string, buffer: any, options?: SaveFileOptions) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this._safePath(destDirPath),
      Body: buffer,
      ContentType: options?.ContentType,
    })
    await this.s3.send(command)
  }

  async getFileReadStream(filePath: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this._safePath(filePath),
    })
    const object = await this.s3.send(command)
    const webStream = object.Body!.transformToWebStream()
    return Readable.fromWeb(webStream as any)
  }

  async isExists(filePath: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: this._safePath(filePath),
    })
    try {
      await this.s3.send(command)
      return true
    } catch (e) {
      return false
    }
  }
}

export { LocalFileManager, S3FileManager, FileManager }
